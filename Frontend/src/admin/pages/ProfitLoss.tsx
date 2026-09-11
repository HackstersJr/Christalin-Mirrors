import { useEffect, useState } from 'react'
import { Printer, ChevronLeft, ChevronRight, Save } from 'lucide-react'
import { invoiceStore, inventoryStore, serviceStore, expenseStore } from '../data/store'
import { branches as branchList } from '../../data/branches'
import type { Invoice, InventoryItem, ServiceRecord, ExpenseCategory } from '../data/types'
import cmLogo from '../../assets/cm-logo-white.png'
import { todayIso, monthKeyOf, shiftMonth, monthLabel, Trend } from './reportUtils'
import '../AdminShared.css'
import '../ReportShared.css'
import './ProfitLoss.css'

// Clean short branch name (e.g. "Belgaum"), matching mapBranch() in store.ts —
// not branchList's fuller display label (e.g. "Belgaum (Belagavi)").
const branchNames = branchList.map(b => b.name.replace('CM — ', '').replace(/\s*\([^)]*\)$/, ''))

const COGS_CATEGORIES: { key: ExpenseCategory; label: string }[] = [
    { key: 'service_commissions', label: 'Service Commissions' },
    { key: 'retail_commissions', label: 'Retail Commissions' },
    { key: 'direct_professional_labor', label: 'Direct Professional Labor' },
    { key: 'transaction_fees', label: 'Transaction Fees' },
]

const OPEX_CATEGORIES: { key: ExpenseCategory; label: string }[] = [
    { key: 'salaries_wages', label: 'Salaries and Wages' },
    { key: 'benefits_insurance', label: 'Benefits and Insurance' },
    { key: 'payroll_tax', label: 'Payroll Tax' },
    { key: 'general_admin', label: 'General and Administrative' },
    { key: 'utilities', label: 'Utilities' },
    { key: 'repairs_maintenance', label: 'Repairs and Maintenance' },
    { key: 'rent_lease', label: 'Rent/Lease' },
    { key: 'depreciation', label: 'Depreciation' },
    { key: 'debts_loans', label: 'Debts and Loans' },
]

const ALL_CATEGORIES = [...COGS_CATEGORIES, ...OPEX_CATEGORIES]

// Ownership split per branch — Bengaluru is fully owned by the CEO;
// Kalaburagi and Belgaum are shared with local partners.
const OWNERSHIP: Record<string, { label: string; pct: number; isCeo?: boolean }[]> = {
    Bengaluru: [{ label: 'CEO', pct: 100, isCeo: true }],
    Kalaburagi: [
        { label: 'Partner 1', pct: 32 },
        { label: 'Partner 2', pct: 32 },
        { label: 'CEO', pct: 36, isCeo: true },
    ],
    Belgaum: [
        { label: 'CEO', pct: 70, isCeo: true },
        { label: 'Partner', pct: 30 },
    ],
}

function ceoPctOf(branch: string): number {
    return OWNERSHIP[branch]?.find(sh => sh.isCeo)?.pct || 0
}

function zeroExpenses(): Record<ExpenseCategory, number> {
    const out = {} as Record<ExpenseCategory, number>
    ALL_CATEGORIES.forEach(c => { out[c.key] = 0 })
    return out
}

function mergeExpenses(list: { category: ExpenseCategory; amount: number }[]): Record<ExpenseCategory, number> {
    const out = zeroExpenses()
    list.forEach(e => { out[e.category] = e.amount })
    return out
}

function money(n: number) { return `₹${Math.round(n).toLocaleString()}` }

type PL = {
    hairServices: number
    otherServices: number
    retailSales: number
    revenue: number
    productCost: number
    cogsManualTotal: number
    totalCogs: number
    grossProfit: number
    totalExpenses: number
    netProfit: number
}

const zeroPL = (): PL => ({ hairServices: 0, otherServices: 0, retailSales: 0, revenue: 0, productCost: 0, cogsManualTotal: 0, totalCogs: 0, grossProfit: 0, totalExpenses: 0, netProfit: 0 })
const sumPL = (a: PL, b: PL): PL => ({
    hairServices: a.hairServices + b.hairServices,
    otherServices: a.otherServices + b.otherServices,
    retailSales: a.retailSales + b.retailSales,
    revenue: a.revenue + b.revenue,
    productCost: a.productCost + b.productCost,
    cogsManualTotal: a.cogsManualTotal + b.cogsManualTotal,
    totalCogs: a.totalCogs + b.totalCogs,
    grossProfit: a.grossProfit + b.grossProfit,
    totalExpenses: a.totalExpenses + b.totalExpenses,
    netProfit: a.netProfit + b.netProfit,
})

function PLLetterhead({ title, range, reportNo, generatedAt }: { title: string; range: string; reportNo: string; generatedAt: string }) {
    return (
        <div className="report-letterhead">
            <div className="report-letterhead-main">
                <img src={cmLogo} alt="Christalin Mirrors" className="report-logo" />
                <div>
                    <div className="report-title">{title}</div>
                    <div className="report-range">{range}</div>
                </div>
            </div>
            <div className="report-letterhead-meta">
                <div><span>Report No.</span> {reportNo}</div>
                <div><span>Generated</span> {generatedAt}</div>
            </div>
        </div>
    )
}

function PLFooter({ reportNo, generatedAt }: { reportNo: string; generatedAt: string }) {
    return (
        <>
            <div className="report-signoff">
                <div className="signoff-block"><span>Prepared by</span></div>
                <div className="signoff-block"><span>Reviewed by</span></div>
                <div className="signoff-block"><span>Date</span></div>
            </div>
            <div className="report-footer">
                {reportNo} · Generated {generatedAt} · Christalin Mirrors — Confidential, Internal Use Only. Retain for records.
            </div>
        </>
    )
}

function StatementCore({ prevMonthLabel, currMonthLabel, pl, prevPl, revenueRows, cogsRows, opexRows }: {
    prevMonthLabel: string
    currMonthLabel: string
    pl: PL
    prevPl: PL
    revenueRows: { label: string; amount: number }[]
    cogsRows: { label: string; amount: number }[]
    opexRows: { label: string; amount: number }[]
}) {
    return (
        <>
            <div className="report-section-title">Net Profit (Loss)</div>
            <div className="table-scroll">
                <table className="admin-table report-table pl-summary-table">
                    <thead><tr><th></th><th>{prevMonthLabel}</th><th>{currMonthLabel}</th></tr></thead>
                    <tbody>
                        <tr className="report-totals-row">
                            <td className="cell-primary">Net Profit</td>
                            <td>{money(prevPl.netProfit)}</td>
                            <td>{money(pl.netProfit)} <Trend curr={pl.netProfit} prev={prevPl.netProfit} /></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="report-section-title">Revenue</div>
            <div className="table-scroll">
                <table className="admin-table report-table pl-line-table">
                    <tbody>
                        {revenueRows.map(row => <tr key={row.label}><td className="cell-primary">{row.label}</td><td>{money(row.amount)}</td></tr>)}
                        <tr className="report-totals-row"><td className="cell-primary">Gross Revenue</td><td>{money(pl.revenue)}</td></tr>
                    </tbody>
                </table>
            </div>

            <div className="report-section-title">Cost of Goods Sold (COGS)</div>
            <div className="table-scroll">
                <table className="admin-table report-table pl-line-table">
                    <tbody>
                        <tr><td className="cell-primary">Hair &amp; Retail Product Cost</td><td>{money(pl.productCost)}</td></tr>
                        {cogsRows.map(row => <tr key={row.label}><td className="cell-primary">{row.label}</td><td>{money(row.amount)}</td></tr>)}
                        <tr className="report-totals-row"><td className="cell-primary">Total COGS</td><td>{money(pl.totalCogs)}</td></tr>
                        <tr className="report-totals-row"><td className="cell-primary">Gross Profit</td><td>{money(pl.grossProfit)}</td></tr>
                    </tbody>
                </table>
            </div>

            <div className="report-section-title">Expenses</div>
            <div className="table-scroll">
                <table className="admin-table report-table pl-line-table">
                    <tbody>
                        {opexRows.map(row => <tr key={row.label}><td className="cell-primary">{row.label}</td><td>{money(row.amount)}</td></tr>)}
                        <tr className="report-totals-row"><td className="cell-primary">Total Expenses</td><td>{money(pl.totalExpenses)}</td></tr>
                        <tr className="report-totals-row pl-net-profit-row">
                            <td className="cell-primary">Net Profit (Gross Profit − Total Expenses)</td>
                            <td>{money(pl.netProfit)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </>
    )
}

export default function ProfitLoss() {
    const [monthKey, setMonthKey] = useState(monthKeyOf(todayIso()))
    const [editBranch, setEditBranch] = useState(branchNames[0])
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [services, setServices] = useState<ServiceRecord[]>([])
    const [expensesByBranch, setExpensesByBranch] = useState<Record<string, Record<ExpenseCategory, number>>>({})
    const [prevExpensesByBranch, setPrevExpensesByBranch] = useState<Record<string, Record<ExpenseCategory, number>>>({})
    const [saving, setSaving] = useState(false)

    const prevMonthKey = shiftMonth(monthKey, -1)

    useEffect(() => {
        invoiceStore.getAll().then(setInvoices)
        inventoryStore.getAll().then(setInventory)
        serviceStore.getAll().then(setServices)
    }, [])

    useEffect(() => {
        let cancelled = false
        Promise.all(branchNames.map(b => expenseStore.getForMonth(monthKey, b).then(list => [b, mergeExpenses(list)] as const)))
            .then(pairs => { if (!cancelled) setExpensesByBranch(Object.fromEntries(pairs)) })
        return () => { cancelled = true }
    }, [monthKey])

    useEffect(() => {
        let cancelled = false
        Promise.all(branchNames.map(b => expenseStore.getForMonth(prevMonthKey, b).then(list => [b, mergeExpenses(list)] as const)))
            .then(pairs => { if (!cancelled) setPrevExpensesByBranch(Object.fromEntries(pairs)) })
        return () => { cancelled = true }
    }, [prevMonthKey])

    async function handleSaveExpenses() {
        setSaving(true)
        const draft = expensesByBranch[editBranch] || zeroExpenses()
        await Promise.all(ALL_CATEGORIES.map(c => expenseStore.save(monthKey, editBranch, c.key, draft[c.key] || 0)))
        setSaving(false)
    }

    const inventoryById = new Map(inventory.map(i => [i.id, i]))
    const serviceCategoryByName = new Map(services.map(s => [s.name, s.category]))

    function computePL(month: string, branch: string, expenses: Record<ExpenseCategory, number>): PL {
        const inv = invoices.filter(i => i.date.slice(0, 7) === month && i.status === 'paid' && i.branch === branch)
        let hairServices = 0, otherServices = 0, retailSales = 0, productCost = 0
        inv.forEach(i => {
            i.items.forEach(it => {
                if (it.productId) {
                    retailSales += it.total
                    const item = inventoryById.get(it.productId)
                    if (item) productCost += item.costPrice * it.quantity
                } else {
                    const cat = serviceCategoryByName.get(it.service)
                    if (cat === 'hair') hairServices += it.total
                    else otherServices += it.total
                }
            })
        })
        const revenue = hairServices + otherServices + retailSales
        const cogsManualTotal = COGS_CATEGORIES.reduce((s, c) => s + (expenses[c.key] || 0), 0)
        const totalCogs = productCost + cogsManualTotal
        const grossProfit = revenue - totalCogs
        const totalExpenses = OPEX_CATEGORIES.reduce((s, c) => s + (expenses[c.key] || 0), 0)
        const netProfit = grossProfit - totalExpenses
        return { hairServices, otherServices, retailSales, revenue, productCost, cogsManualTotal, totalCogs, grossProfit, totalExpenses, netProfit }
    }

    const branchResults = branchNames.map(b => ({
        branch: b,
        current: computePL(monthKey, b, expensesByBranch[b] || zeroExpenses()),
        previous: computePL(prevMonthKey, b, prevExpensesByBranch[b] || zeroExpenses()),
    }))

    const current = branchResults.reduce((t, r) => sumPL(t, r.current), zeroPL())
    const previous = branchResults.reduce((t, r) => sumPL(t, r.previous), zeroPL())
    const totalCeoShare = branchResults.reduce((s, r) => s + r.current.netProfit * ceoPctOf(r.branch) / 100, 0)

    const editDraft = expensesByBranch[editBranch] || zeroExpenses()
    const reportNo = `CM/PL/${monthKey.replace('-', '')}`
    const generatedAt = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    const currMonthLabel = monthLabel(monthKey)
    const prevMonthLabel = monthLabel(prevMonthKey)

    return (
        <div>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                <div>
                    <h1 className="admin-page-title" style={{ marginBottom: 0 }}>Profit &amp; Loss</h1>
                    <p className="admin-page-sub">Prints one full statement per branch, followed by an all-branches summary with CEO Share</p>
                </div>
                <button className="admin-btn admin-btn-primary" onClick={() => window.print()}><Printer size={14} /> Print</button>
            </div>

            <div className="no-print" style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setMonthKey(shiftMonth(monthKey, -1))}><ChevronLeft size={16} /></button>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 150, textAlign: 'center' }}>{currMonthLabel}</span>
                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setMonthKey(shiftMonth(monthKey, 1))}><ChevronRight size={16} /></button>
                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setMonthKey(monthKeyOf(todayIso()))}>This Month</button>
                </div>
            </div>

            <div className="no-print pl-expense-panel">
                <div className="pl-expense-title-row">
                    <div className="pl-expense-title">Monthly Costs — {currMonthLabel}</div>
                    <select className="admin-filter-select" value={editBranch} onChange={e => setEditBranch(e.target.value)}>
                        {branchNames.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
                <div className="pl-expense-columns">
                    <div>
                        <div className="pl-expense-group-label">Cost of Goods Sold</div>
                        {COGS_CATEGORIES.map(c => (
                            <label key={c.key} className="pl-expense-row">
                                {c.label}
                                <input type="number" min={0} value={editDraft[c.key]}
                                    onChange={e => setExpensesByBranch({ ...expensesByBranch, [editBranch]: { ...editDraft, [c.key]: Number(e.target.value) } })} />
                            </label>
                        ))}
                    </div>
                    <div>
                        <div className="pl-expense-group-label">Operating Expenses</div>
                        {OPEX_CATEGORIES.map(c => (
                            <label key={c.key} className="pl-expense-row">
                                {c.label}
                                <input type="number" min={0} value={editDraft[c.key]}
                                    onChange={e => setExpensesByBranch({ ...expensesByBranch, [editBranch]: { ...editDraft, [c.key]: Number(e.target.value) } })} />
                            </label>
                        ))}
                    </div>
                </div>
                <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={handleSaveExpenses} disabled={saving} style={{ marginTop: 12 }}>
                    <Save size={13} /> {saving ? 'Saving…' : `Save Monthly Costs — ${editBranch}`}
                </button>
            </div>

            <div className="report-sheet print-doc">
                {branchResults.map((r, idx) => {
                    const shareholders = OWNERSHIP[r.branch] || []
                    const branchCode = r.branch.slice(0, 3).toUpperCase()
                    const branchReportNo = `CM/PL/${branchCode}/${monthKey.replace('-', '')}`
                    const draft = expensesByBranch[r.branch] || zeroExpenses()
                    const cogsRows = COGS_CATEGORIES.map(c => ({ label: c.label, amount: draft[c.key] || 0 }))
                    const opexRows = OPEX_CATEGORIES.map(c => ({ label: c.label, amount: draft[c.key] || 0 }))
                    const revenueRows = [
                        { label: 'Hair Services', amount: r.current.hairServices },
                        { label: 'Other Services', amount: r.current.otherServices },
                        { label: 'Retail Sales', amount: r.current.retailSales },
                    ]

                    return (
                        <div key={r.branch} className={idx > 0 ? 'pl-page-break' : undefined}>
                            <PLLetterhead
                                title={`Christalin Mirrors — ${r.branch} — Profit & Loss Statement`}
                                range={`For the Month Ended ${currMonthLabel}`}
                                reportNo={branchReportNo}
                                generatedAt={generatedAt}
                            />

                            <StatementCore prevMonthLabel={prevMonthLabel} currMonthLabel={currMonthLabel} pl={r.current} prevPl={r.previous}
                                revenueRows={revenueRows} cogsRows={cogsRows} opexRows={opexRows} />

                            <div className="report-section-title">Profit Split — {r.branch}</div>
                            <div className="table-scroll">
                                <table className="admin-table report-table pl-line-table">
                                    <thead><tr><th>Shareholder</th><th>Share %</th><th>Share Amount</th></tr></thead>
                                    <tbody>
                                        {shareholders.map(sh => (
                                            <tr key={sh.label} className={sh.isCeo ? 'pl-ceo-row' : ''}>
                                                <td className="cell-primary">{sh.label}</td>
                                                <td>{sh.pct}%</td>
                                                <td>{money(r.current.netProfit * sh.pct / 100)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="report-note">
                                Note: Revenue and Hair &amp; Retail Product Cost for {r.branch} are computed automatically from paid invoices and inventory cost price. All other COGS and Expense lines are entered manually each month (see Monthly Costs above) and carry forward until updated.
                            </div>

                            <PLFooter reportNo={branchReportNo} generatedAt={generatedAt} />
                        </div>
                    )
                })}

                <div className="pl-page-break">
                    <PLLetterhead
                        title="Christalin Mirrors — Profit & Loss Statement"
                        range={`For the Month Ended ${currMonthLabel} — All Branches`}
                        reportNo={reportNo}
                        generatedAt={generatedAt}
                    />

                    <StatementCore prevMonthLabel={prevMonthLabel} currMonthLabel={currMonthLabel} pl={current} prevPl={previous}
                        revenueRows={branchResults.map(r => ({ label: r.branch, amount: r.current.revenue }))}
                        cogsRows={COGS_CATEGORIES.map(c => ({ label: c.label, amount: branchResults.reduce((s, r) => s + ((expensesByBranch[r.branch] || zeroExpenses())[c.key] || 0), 0) }))}
                        opexRows={OPEX_CATEGORIES.map(c => ({ label: c.label, amount: branchResults.reduce((s, r) => s + ((expensesByBranch[r.branch] || zeroExpenses())[c.key] || 0), 0) }))}
                    />

                    <div className="report-section-title">Branch Profit Split — CEO Share</div>
                    <div className="table-scroll">
                        <table className="admin-table report-table pl-line-table">
                            <thead><tr><th>Branch</th><th>Net Profit</th><th>CEO %</th><th>CEO Share</th></tr></thead>
                            <tbody>
                                {branchResults.map(r => (
                                    <tr key={r.branch} className="pl-ceo-row">
                                        <td className="cell-primary">{r.branch}</td>
                                        <td>{money(r.current.netProfit)}</td>
                                        <td>{ceoPctOf(r.branch)}%</td>
                                        <td>{money(r.current.netProfit * ceoPctOf(r.branch) / 100)}</td>
                                    </tr>
                                ))}
                                <tr className="report-totals-row">
                                    <td className="cell-primary" colSpan={3}>Total CEO Share (All Branches)</td>
                                    <td>{money(totalCeoShare)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="report-note">
                        Note: Revenue and Hair &amp; Retail Product Cost are computed automatically from paid invoices and inventory cost price, per branch. All other COGS and Expense lines are entered manually each month per branch (see Monthly Costs above) and carry forward until updated. CEO Share is each branch's Net Profit × the CEO's ownership % in that branch — see each branch's own Profit Split page for the full partner breakdown.
                    </div>

                    <PLFooter reportNo={reportNo} generatedAt={generatedAt} />
                </div>
            </div>
        </div>
    )
}
