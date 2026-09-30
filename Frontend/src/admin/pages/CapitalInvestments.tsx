import React, { useState, useMemo } from 'react'
import {
    Plus, Trash2, Edit3, DollarSign, Building, Download,
    CheckCircle2, Clock, Info, ShieldCheck, Wallet, UserCheck
} from 'lucide-react'
import { capitalInvestmentStore, CapitalInvestment } from '../data/capitalInvestmentStore'
import { UPCOMING_BRANCHES } from '../data/manualSalesStore'
import cmLogo from '../../assets/cm-logo-white.png'

const CATEGORY_LABELS: Record<string, string> = {
    civil_fitout: 'Civil Works & Interior Joinery',
    furniture_styling_chairs: 'Hydraulic Chairs & Styling Consoles',
    electrical_lighting: 'Architectural Lighting & Cabling',
    plumbing_washunits: 'Commercial Plumbing & Wash Basins',
    hvac_ac: 'HVAC Air Conditioning',
    lease_advance: 'Premises Lease Deposit Advance',
    licenses_permits: 'Trade Licenses & Municipal Permits',
    signage_branding: 'Exterior 3D Glow Signage',
    other: 'General Expansion Outlay'
}

export default function CapitalInvestments() {
    const [selectedBranch, setSelectedBranch] = useState<string>('all')
    const [investments, setInvestments] = useState<CapitalInvestment[]>(() => capitalInvestmentStore.getAll())
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<CapitalInvestment | null>(null)

    // Form State
    const [formData, setFormData] = useState({
        branch: 'Upcoming Branch 1 (Yelahanka)',
        date: new Date().toISOString().slice(0, 10),
        contributor: 'CEO' as 'CEO' | 'Partner' | 'Joint',
        contributorName: 'CEO (Meghnath / Director)',
        amount: '',
        paymentMode: 'Bank Transfer' as 'Bank Transfer' | 'Direct Vendor Pay' | 'Cheque' | 'Cash',
        category: 'furniture_styling_chairs' as CapitalInvestment['category'],
        itemDescription: '',
        vendorName: '',
        invoiceRef: '',
        notes: ''
    })

    const refreshData = () => {
        setInvestments(capitalInvestmentStore.getAll())
    }

    const filteredList = useMemo(() => {
        if (selectedBranch === 'all') return investments
        return investments.filter(item => item.branch === selectedBranch)
    }, [investments, selectedBranch])

    const totals = useMemo(() => {
        return capitalInvestmentStore.getTotals(selectedBranch)
    }, [investments, selectedBranch])

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault()
        const amountNum = parseFloat(formData.amount)
        if (isNaN(amountNum) || amountNum <= 0) {
            alert('Please enter a valid investment amount.')
            return
        }

        if (editingItem) {
            capitalInvestmentStore.updateRecord(editingItem.id, {
                branch: formData.branch,
                date: formData.date,
                contributor: formData.contributor,
                contributorName: formData.contributorName,
                amount: amountNum,
                paymentMode: formData.paymentMode,
                category: formData.category,
                itemDescription: formData.itemDescription,
                vendorName: formData.vendorName,
                invoiceRef: formData.invoiceRef,
                notes: formData.notes
            })
        } else {
            capitalInvestmentStore.addRecord({
                branch: formData.branch,
                date: formData.date,
                contributor: formData.contributor,
                contributorName: formData.contributorName,
                amount: amountNum,
                paymentMode: formData.paymentMode,
                category: formData.category,
                itemDescription: formData.itemDescription,
                vendorName: formData.vendorName,
                invoiceRef: formData.invoiceRef,
                notes: formData.notes,
                recordedBy: 'CEO / Solo Admin'
            })
        }

        setIsAddModalOpen(false)
        setEditingItem(null)
        refreshData()
    }

    const handleOpenEdit = (item: CapitalInvestment) => {
        setEditingItem(item)
        setFormData({
            branch: item.branch,
            date: item.date,
            contributor: item.contributor,
            contributorName: item.contributorName,
            amount: String(item.amount),
            paymentMode: item.paymentMode,
            category: item.category,
            itemDescription: item.itemDescription,
            vendorName: item.vendorName || '',
            invoiceRef: item.invoiceRef || '',
            notes: item.notes || ''
        })
        setIsAddModalOpen(true)
    }

    const handleDelete = (id: string) => {
        if (confirm('Are you sure you want to remove this capital contribution entry?')) {
            capitalInvestmentStore.deleteRecord(id)
            refreshData()
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const money = (val: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val || 0)
    }

    return (
        <div className="manual-pl-page" style={{ paddingBottom: 60 }}>
            {/* Header & Controls */}
            <div className="manual-pl-header no-print">
                <div>
                    <h1 className="manual-pl-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Wallet className="text-primary" size={26} />
                        CEO &amp; Partner Capital Infusion Ledger
                    </h1>
                    <p className="manual-pl-subtitle">
                        Record external equity contributed by the CEO and her Partner for new salon branches. Kept strictly isolated from salon operating cash.
                    </p>
                </div>

                <div className="manual-pl-actions">
                    <button
                        type="button"
                        className="admin-btn admin-btn-sm"
                        onClick={handlePrint}
                    >
                        <Download size={14} /> Export / Print A4
                    </button>
                    <button
                        type="button"
                        className="admin-btn admin-btn-sm admin-btn-primary"
                        onClick={() => {
                            setEditingItem(null)
                            setFormData({
                                branch: selectedBranch === 'all' ? UPCOMING_BRANCHES[0] : selectedBranch,
                                date: new Date().toISOString().slice(0, 10),
                                contributor: 'CEO',
                                contributorName: 'CEO (Meghnath / Director)',
                                amount: '',
                                paymentMode: 'Bank Transfer',
                                category: 'furniture_styling_chairs',
                                itemDescription: '',
                                vendorName: '',
                                invoiceRef: '',
                                notes: ''
                            })
                            setIsAddModalOpen(true)
                        }}
                    >
                        <Plus size={14} /> Record Capital Infusion
                    </button>
                </div>
            </div>

            {/* Solo Admin Notice Banner */}
            <div className="no-print" style={{
                background: 'rgba(181, 148, 88, 0.08)',
                border: '1px solid rgba(181, 148, 88, 0.25)',
                borderRadius: 8,
                padding: '12px 18px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ShieldCheck size={20} color="#b59458" />
                    <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-bright)', fontSize: 13 }}>
                            Sole Administrator Data Entry Mode Active
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            All entries are timestamped and attributed to the central owner account. When managers join later, their access can be restricted without restructuring this data.
                        </div>
                    </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#b59458', background: 'rgba(181, 148, 88, 0.15)', padding: '4px 10px', borderRadius: 4 }}>
                    Logged in as: Sole Admin (Meghnath)
                </div>
            </div>

            {/* Filters */}
            <div className="no-print manual-pl-controls" style={{ marginBottom: 20 }}>
                <div className="manual-pl-control-group">
                    <label className="manual-pl-control-label">Filter Branch Project:</label>
                    <select
                        className="manual-pl-select"
                        value={selectedBranch}
                        onChange={e => setSelectedBranch(e.target.value)}
                        style={{ minWidth: 260 }}
                    >
                        <option value="all">All Expansion Projects (Consolidated)</option>
                        {UPCOMING_BRANCHES.map(b => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Executive KPI Overview Cards */}
            <div className="no-print manual-pl-metrics-grid" style={{ marginBottom: 24 }}>
                <div className="manual-pl-metric-card" style={{ borderLeft: '3px solid #6366f1' }}>
                    <span className="manual-pl-metric-title">Total Capital Infused</span>
                    <span className="manual-pl-metric-val" style={{ color: '#6366f1' }}>{money(totals.total)}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {totals.count} dedicated project assets logged
                    </span>
                </div>

                <div className="manual-pl-metric-card" style={{ borderLeft: '3px solid var(--color-primary, #b59458)' }}>
                    <span className="manual-pl-metric-title">CEO Contribution</span>
                    <span className="manual-pl-metric-val" style={{ color: 'var(--color-primary, #b59458)' }}>{money(totals.ceoTotal)}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {totals.total > 0 ? `${((totals.ceoTotal / totals.total) * 100).toFixed(1)}% of total equity` : '0%'}
                    </span>
                </div>

                <div className="manual-pl-metric-card" style={{ borderLeft: '3px solid #10b981' }}>
                    <span className="manual-pl-metric-title">Partner Contribution</span>
                    <span className="manual-pl-metric-val" style={{ color: '#10b981' }}>{money(totals.partnerTotal)}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {totals.total > 0 ? `${((totals.partnerTotal / totals.total) * 100).toFixed(1)}% of total equity` : '0%'}
                    </span>
                </div>

                <div className="manual-pl-metric-card">
                    <span className="manual-pl-metric-title">Target Expansion Target</span>
                    <span className="manual-pl-metric-val">₹30,00,000</span>
                    <span style={{ fontSize: 11, color: '#3b82f6' }}>
                        Yelahanka (₹15L) + Hassan (₹15L)
                    </span>
                </div>
            </div>

            {/* Printable Document A4 Container */}
            <div className="report-sheet print-doc">
                {/* Letterhead */}
                <div className="report-letterhead">
                    <div className="report-letterhead-main">
                        <img src={cmLogo} alt="Christalin Mirrors" className="report-logo" />
                        <div>
                            <div className="report-title">
                                Christalin Mirrors Luxury Salon — Capital Infusion Ledger
                            </div>
                            <div className="report-range">
                                {selectedBranch === 'all' ? 'All Expansion Projects (Consolidated)' : selectedBranch} · Equity Contributions
                            </div>
                        </div>
                    </div>
                    <div className="report-letterhead-meta">
                        <div><span>Ledger No.</span> CM/EQUITY/2026/Q3</div>
                        <div><span>Scope</span> CEO &amp; Partner External Capital</div>
                        <div><span>Audit Status</span> Verified by Sole Admin</div>
                        <div><span>Date</span> {new Date().toLocaleDateString('en-GB')}</div>
                    </div>
                </div>

                {/* Explanatory Banner in Print */}
                <div style={{
                    padding: '12px 16px',
                    borderRadius: 6,
                    background: 'rgba(99, 102, 241, 0.05)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    marginBottom: 20,
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5
                }}>
                    <strong>Accounting Policy Note:</strong> The capital outlays registered below represent direct equity injections provided by the <strong>CEO and her Partner</strong>. In accordance with corporate governance, these funds are isolated from the operating revenue and daily OpEx of existing salons (Bengaluru, Kalaburagi, Belgaum, and Manea).
                </div>

                {/* Table of Capital Contributions */}
                <div className="table-scroll">
                    <table className="admin-table report-table manual-pl-table">
                        <thead>
                            <tr>
                                <th style={{ width: 100 }}>Date</th>
                                <th>Branch Project</th>
                                <th>Item Description &amp; Scope</th>
                                <th>Category</th>
                                <th>Contributor</th>
                                <th>Mode / Ref</th>
                                <th style={{ width: 140, textAlign: 'right' }}>Amount (₹)</th>
                                <th className="no-print" style={{ width: 80, textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredList.length > 0 ? (
                                filteredList.map(item => (
                                    <tr key={item.id}>
                                        <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{item.date}</td>
                                        <td style={{ fontWeight: 600, fontSize: 12 }}>
                                            {item.branch.replace('Upcoming Branch ', 'Upc. ')}
                                        </td>
                                        <td className="cell-primary">
                                            <div style={{ fontWeight: 600 }}>{item.itemDescription}</div>
                                            {item.vendorName && (
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                                    Vendor: {item.vendorName}
                                                </div>
                                            )}
                                            {item.notes && (
                                                <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: 2 }}>
                                                    {item.notes}
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span style={{
                                                background: 'rgba(99, 102, 241, 0.1)',
                                                color: '#6366f1',
                                                padding: '2px 8px',
                                                borderRadius: 4,
                                                fontSize: 11,
                                                fontWeight: 600,
                                                display: 'inline-block'
                                            }}>
                                                {CATEGORY_LABELS[item.category] || item.category}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{
                                                background: item.contributor === 'CEO' ? 'rgba(181, 148, 88, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                                color: item.contributor === 'CEO' ? 'var(--color-primary, #b59458)' : '#10b981',
                                                padding: '3px 8px',
                                                borderRadius: 4,
                                                fontSize: 11,
                                                fontWeight: 700
                                            }}>
                                                {item.contributor}
                                            </span>
                                            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                                                {item.contributorName}
                                            </div>
                                        </td>
                                        <td style={{ fontSize: 12 }}>
                                            <div>{item.paymentMode}</div>
                                            {item.invoiceRef && (
                                                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                                    Ref: {item.invoiceRef}
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 13 }}>
                                            {money(item.amount)}
                                        </td>
                                        <td className="no-print" style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                                                <button
                                                    type="button"
                                                    className="admin-btn-icon text-muted"
                                                    onClick={() => handleOpenEdit(item)}
                                                    title="Edit Entry"
                                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
                                                >
                                                    <Edit3 size={13} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="admin-btn-icon text-muted"
                                                    onClick={() => handleDelete(item.id)}
                                                    title="Delete Entry"
                                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                                        No capital investment records found for this selection. Click "Record Capital Infusion" to log an entry.
                                    </td>
                                </tr>
                            )}

                            {/* Summary Rows */}
                            <tr className="report-totals-row" style={{ background: 'rgba(181, 148, 88, 0.08)' }}>
                                <td colSpan={6} className="cell-primary" style={{ fontWeight: 700 }}>
                                    Total CEO Capital Infusion
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--color-primary, #b59458)' }}>
                                    {money(totals.ceoTotal)}
                                </td>
                                <td className="no-print" />
                            </tr>
                            <tr className="report-totals-row" style={{ background: 'rgba(16, 185, 129, 0.08)' }}>
                                <td colSpan={6} className="cell-primary" style={{ fontWeight: 700 }}>
                                    Total Partner Capital Infusion
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 800, color: '#10b981' }}>
                                    {money(totals.partnerTotal)}
                                </td>
                                <td className="no-print" />
                            </tr>
                            <tr className="report-totals-row" style={{ background: 'rgba(99, 102, 241, 0.12)' }}>
                                <td colSpan={6} className="cell-primary" style={{ fontWeight: 800, fontSize: 14 }}>
                                    Grand Total Equity Deployed (CEO + Partner)
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 16, color: '#6366f1' }}>
                                    {money(totals.total)}
                                </td>
                                <td className="no-print" />
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Signatures Block */}
                <div className="report-sign-grid" style={{ marginTop: 40 }}>
                    <div className="report-sign-block">
                        <div className="report-sign-line" />
                        <div className="report-sign-role">Managing Director / CEO Signature</div>
                    </div>
                    <div className="report-sign-block">
                        <div className="report-sign-line" />
                        <div className="report-sign-role">Expansion Co-Investor Partner Signature</div>
                    </div>
                </div>

                <div className="report-footer">
                    <div className="report-footer-left">
                        Christalin Mirrors Luxury Salon · Corporate Equity &amp; Expansion Register
                    </div>
                    <div className="report-footer-right">
                        Confidential · Management &amp; Partners Eyes Only
                    </div>
                </div>
            </div>

            {/* Modal for Recording Capital Infusion */}
            {isAddModalOpen && (
                <div className="modal-backdrop" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: 16
                }}>
                    <div className="modal-content" style={{
                        background: 'var(--bg-card, #1c1d22)',
                        border: '1px solid var(--border-color, #2d2e36)',
                        borderRadius: 10,
                        width: '100%',
                        maxWidth: 580,
                        padding: 24,
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-bright)' }}>
                                {editingItem ? 'Edit Capital Infusion Entry' : 'Record New Capital Infusion'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSave}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                                        Branch Project *
                                    </label>
                                    <select
                                        className="manual-pl-select"
                                        style={{ width: '100%' }}
                                        value={formData.branch}
                                        onChange={e => setFormData({ ...formData, branch: e.target.value })}
                                        required
                                    >
                                        {UPCOMING_BRANCHES.map(b => (
                                            <option key={b} value={b}>{b}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                                        Date of Outlay *
                                    </label>
                                    <input
                                        type="date"
                                        className="manual-pl-input"
                                        style={{ width: '100%' }}
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                                        Contributing Investor *
                                    </label>
                                    <select
                                        className="manual-pl-select"
                                        style={{ width: '100%' }}
                                        value={formData.contributor}
                                        onChange={e => {
                                            const cont = e.target.value as 'CEO' | 'Partner' | 'Joint'
                                            setFormData({
                                                ...formData,
                                                contributor: cont,
                                                contributorName: cont === 'CEO' ? 'CEO (Meghnath / Director)' : cont === 'Partner' ? 'Partner (Expansion Co-Investor)' : 'Joint (CEO & Partner 50/50)'
                                            })
                                        }}
                                        required
                                    >
                                        <option value="CEO">CEO (Lead Director)</option>
                                        <option value="Partner">Partner (Expansion Co-Investor)</option>
                                        <option value="Joint">Joint (50/50 Shared)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                                        Amount (₹) *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        placeholder="e.g. 120000"
                                        className="manual-pl-input"
                                        style={{ width: '100%', fontWeight: 700 }}
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                                        Asset / Expense Category *
                                    </label>
                                    <select
                                        className="manual-pl-select"
                                        style={{ width: '100%' }}
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                        required
                                    >
                                        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                                            <option key={k} value={k}>{v}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                                        Payment Method *
                                    </label>
                                    <select
                                        className="manual-pl-select"
                                        style={{ width: '100%' }}
                                        value={formData.paymentMode}
                                        onChange={e => setFormData({ ...formData, paymentMode: e.target.value as any })}
                                        required
                                    >
                                        <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                                        <option value="Direct Vendor Pay">Direct Vendor Payment</option>
                                        <option value="Cheque">Commercial Cheque</option>
                                        <option value="Cash">Cash Advance</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: 14 }}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                                    Item Description &amp; Scope *
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. 6x Hydraulic Styling Chairs & 2x Shampoo Wash Units (Advance 50%)"
                                    className="manual-pl-input"
                                    style={{ width: '100%' }}
                                    value={formData.itemDescription}
                                    onChange={e => setFormData({ ...formData, itemDescription: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                                        Vendor / Supplier Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Glitz Salon Furnishings"
                                        className="manual-pl-input"
                                        style={{ width: '100%' }}
                                        value={formData.vendorName}
                                        onChange={e => setFormData({ ...formData, vendorName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                                        Invoice / Agreement Ref
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. INV-9821 or LEASE-AGR-01"
                                        className="manual-pl-input"
                                        style={{ width: '100%' }}
                                        value={formData.invoiceRef}
                                        onChange={e => setFormData({ ...formData, invoiceRef: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                                    Audit Remarks / Notes
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="e.g. Milestone 1 paid upon shipment dispatch. Balance due on installation."
                                    className="manual-pl-input-notes"
                                    style={{ width: '100%' }}
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                                <button
                                    type="button"
                                    className="admin-btn admin-btn-sm"
                                    onClick={() => setIsAddModalOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="admin-btn admin-btn-sm admin-btn-primary"
                                >
                                    {editingItem ? 'Update Contribution' : 'Save Capital Contribution'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
