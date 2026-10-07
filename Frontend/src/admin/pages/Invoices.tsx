import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Search, FileText, ArrowLeft, Eye, Download, Bluetooth, Share2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { invoiceStore, clientStore, serviceStore } from '../data/store'
import { getBranchScope, scopeByBranch } from '../data/authStore'
import type { Invoice, InvoiceItem } from '../data/types'
import { getBranchAddress, getBranchPhone } from '../../data/branches'
import { printInvoiceViaBluetooth, generate32ColReceiptText } from '../utils/seznikVeerPrinter'
import SeznikVeerReceipt from '../components/SeznikVeerReceipt'
import '../AdminShared.css'
import './Billing.css'

// ─── Invoice Detail View ────────────────────────────────────
function InvoiceDetail() {
    const { invoiceId } = useParams<{ invoiceId: string }>()
    const navigate = useNavigate()
    const [invoice, setInvoice] = useState<Invoice | null>(null)
    const [isBtPrinting, setIsBtPrinting] = useState<boolean>(false)
    const [btMessage, setBtMessage] = useState<{ text: string; error?: boolean } | null>(null)

    useEffect(() => {
        if (invoiceId) {
            invoiceStore.getById(invoiceId).then(inv => setInvoice(inv || null))
        }
    }, [invoiceId])

    if (!invoice) {
        return (
            <div className="admin-empty" style={{ padding: 60 }}>
                <h3>Invoice not found</h3>
                <button className="admin-btn admin-btn-primary" onClick={() => navigate('/admin/invoices')}>Back</button>
            </div>
        )
    }

    const managerBranch = getBranchScope()
    const branchName = managerBranch || invoice.branch || 'Belgaum'
    const branchAddress = getBranchAddress(branchName)
    const branchPhone = getBranchPhone(branchName)

    const updateStatus = async (status: Invoice['status']) => {
        await invoiceStore.update(invoice.id, { status })
        setInvoice({ ...invoice, status })
    }

    // Direct Web Bluetooth Print (SEZNIK Veer 58mm Roll)
    const handleBluetoothPrint = async () => {
        setIsBtPrinting(true)
        setBtMessage(null)
        try {
            const res = await printInvoiceViaBluetooth(invoice, {
                branchName,
                branchAddress,
                branchPhone,
                showUpiQr: false,
                showEan13: true,
            })
            setBtMessage({ text: res.message, error: !res.success })
        } catch (err: any) {
            setBtMessage({ text: err.message || 'Bluetooth connection error.', error: true })
        } finally {
            setIsBtPrinting(false)
        }
    }

    // Share Receipt on WhatsApp
    const handleShareWhatsApp = () => {
        let text = `*Christalin Mirrors — ${branchName}*\n`
        text += `_Refine · Reflect · Radiate_\n\n`
        text += `*Invoice:* ${invoice.invoiceNumber}\n`
        text += `*Date:* ${new Date(invoice.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}\n`
        if (invoice.clientName) text += `*Client:* ${invoice.clientName}\n`
        if (invoice.stylist) text += `*Stylist:* ${invoice.stylist}\n`
        text += `\n*Services / Items:*\n`
        invoice.items.forEach(i => {
            if (!i.service) return
            text += `• ${i.service} (x${i.quantity}) — ₹${Number(i.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`
        })
        const taxable = Math.max(0, (invoice.subtotal || 0) - (invoice.discountAmount || 0))
        const halfRate = (invoice.taxPercent || 5) / 2
        const halfTax = Number(((taxable * halfRate) / 100).toFixed(2)) || Number(((invoice.taxAmount || 0) / 2).toFixed(2))
        text += `\nSubtotal: ₹${Number(invoice.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`
        if (invoice.discountAmount > 0) {
            const discLabel = invoice.discountPercent > 0 ? `Discount (${invoice.discountPercent}%):` : 'Discount:'
            text += `${discLabel} -₹${Number(invoice.discountAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`
        }
        if (invoice.taxAmount > 0) {
            text += `CGST (${halfRate}%): ₹${halfTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`
            text += `SGST (${halfRate}%): ₹${halfTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`
        }
        text += `*Grand Total: ₹${Number(invoice.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*\n`
        text += `Payment Mode: ${(invoice.paymentMethod || 'CASH').toUpperCase()}\n\n`
        text += `*Branch:* ${branchName}\n`
        text += `${branchAddress}\n`
        text += `Ph: ${branchPhone}\n`
        text += `GSTIN: 29AAVFC4475G1ZU\n\n`
        text += `Thank you! Visit again.\n*Team Christalin Mirrors*`

        const phoneNum = (invoice.clientPhone || '').replace(/\D/g, '')
        const url = phoneNum
            ? `https://wa.me/${phoneNum.length === 10 ? '91' + phoneNum : phoneNum}?text=${encodeURIComponent(text)}`
            : `https://wa.me/?text=${encodeURIComponent(text)}`
        window.open(url, '_blank')
    }

    // Download formatted .txt bill
    const handleDownloadTxt = () => {
        const fullReceiptText = generate32ColReceiptText(invoice, {
            branchName,
            branchAddress,
            branchPhone,
            showUpiQr: false,
            showEan13: true,
            omitBrandHeader: false,
            omitBranchInfoBlock: false,
        })
        const blob = new Blob([fullReceiptText], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${invoice.invoiceNumber}_${branchName.replace(/\s+/g, '_')}_bill.txt`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div>
            {/* Header: Title on Left, Bluetooth Print + WhatsApp + Download on Top Right */}
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button className="admin-btn admin-btn-ghost" onClick={() => navigate('/admin/invoices')}>
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="admin-page-title" style={{ marginBottom: 0 }}>{invoice.invoiceNumber}</h1>
                        <p className="admin-page-sub">Invoice for {invoice.clientName} &bull; {branchName}</p>
                    </div>
                    <span className={`status-badge ${invoice.status === 'paid' ? 'confirmed' : invoice.status === 'sent' ? 'pending' : invoice.status}`}>{invoice.status}</span>
                </div>

                {/* Top Right Action Buttons (Bluetooth Print ONLY, WhatsApp Share, Download Bill) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        className="admin-btn admin-btn-primary"
                        onClick={handleBluetoothPrint}
                        disabled={isBtPrinting}
                        style={{
                            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                            borderColor: '#0284c7',
                            color: '#ffffff',
                            fontWeight: 600,
                            gap: 7,
                            padding: '8px 16px',
                            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
                        }}
                        title="Print directly to SEZNIK Veer via Web Bluetooth"
                    >
                        <Bluetooth size={16} />
                        <span>{isBtPrinting ? 'Connecting…' : 'Pair & Print (Bluetooth)'}</span>
                    </button>

                    <button
                        type="button"
                        className="admin-btn admin-btn-whatsapp"
                        onClick={handleShareWhatsApp}
                        style={{ gap: 6, fontWeight: 500 }}
                        title="Share on WhatsApp"
                    >
                        <Share2 size={14} />
                        <span>Share on WhatsApp</span>
                    </button>

                    <button
                        type="button"
                        className="admin-btn admin-btn-secondary"
                        onClick={handleDownloadTxt}
                        style={{ gap: 6 }}
                        title="Download Bill (.txt)"
                    >
                        <Download size={14} />
                        <span>Download</span>
                    </button>
                </div>
            </div>

            {/* Bluetooth status feedback banner */}
            {btMessage && (
                <div
                    className="no-print"
                    style={{
                        padding: '9px 14px',
                        borderRadius: 6,
                        fontSize: 12,
                        marginBottom: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: btMessage.error ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                        color: btMessage.error ? '#ef4444' : '#10b981',
                        border: `1px solid ${btMessage.error ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                    }}
                >
                    {btMessage.error ? (
                        <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    ) : (
                        <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                    )}
                    <span>{btMessage.text}</span>
                </div>
            )}

            {/* SEZNIK Veer 58mm Thermal Roll Bill (Rendered Directly) */}
            <div style={{ maxWidth: 580, margin: '0 auto', padding: '6px 0' }}>
                <SeznikVeerReceipt invoice={invoice} hideToolbar />
            </div>

            {/* Invoice Status Actions */}
            <div className="no-print" style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap', maxWidth: 420, margin: '16px auto 0', justifyContent: 'center' }}>
                {invoice.status === 'draft' && <button className="admin-btn admin-btn-primary" onClick={() => updateStatus('sent')}>Mark as Sent</button>}
                {(invoice.status === 'sent' || invoice.status === 'overdue' || invoice.status === 'draft') && <button className="admin-btn admin-btn-primary" style={{ background: 'var(--success)', color: 'white', borderColor: 'var(--success)' }} onClick={() => updateStatus('paid')}>Mark as Paid</button>}
                {invoice.status !== 'cancelled' && invoice.status !== 'paid' && <button className="admin-btn admin-btn-danger" onClick={() => updateStatus('cancelled')}>Cancel Invoice</button>}
            </div>
        </div>
    )
}

// ─── Invoice List ───────────────────────────────────────────
function InvoiceList() {
    const navigate = useNavigate()
    const branchScope = getBranchScope()
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [clients, setClients] = useState<any[]>([])
    const [services, setServices] = useState<any[]>([])
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [showForm, setShowForm] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [items, setItems] = useState<InvoiceItem[]>([{ service: '', quantity: 1, unitPrice: 0, total: 0 }])
    const [formData, setFormData] = useState({ clientId: '', discountPercent: 0, taxPercent: 5, paymentMethod: 'cash' as Invoice['paymentMethod'], branch: branchScope || 'Bengaluru', stylist: '', notes: '' })

    const reload = async () => {
        const data = await invoiceStore.getAll()
        setInvoices(scopeByBranch(data))
    }
    useEffect(() => {
        reload()
        clientStore.getAll().then(cls => setClients(scopeByBranch(cls)))
        serviceStore.getAll().then(svcs => setServices(svcs))
    }, [])

    const filtered = invoices.filter(inv => {
        const matchSearch = inv.clientName.toLowerCase().includes(search.toLowerCase()) || inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())
        const matchStatus = statusFilter === 'all' || inv.status === statusFilter
        return matchSearch && matchStatus
    }).sort((a, b) => b.date.localeCompare(a.date))

    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0)
    const outstanding = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + (i.total - i.amountPaid), 0)

    const updateItem = (idx: number, field: keyof InvoiceItem, value: string | number) => {
        const updated = [...items]
        updated[idx] = { ...updated[idx], [field]: value }
        if (field === 'service') {
            const svc = services.find(s => s.name === value)
            if (svc) { updated[idx].unitPrice = svc.price; updated[idx].total = Number((svc.price * updated[idx].quantity).toFixed(2)) }
        }
        if (field === 'quantity' || field === 'unitPrice') {
            updated[idx].total = Number(((Number(updated[idx].unitPrice) || 0) * (Number(updated[idx].quantity) || 1)).toFixed(2))
        }
        setItems(updated)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isSaving) return // guards against double-click creating two invoices
        const client = clients.find(c => c.id === formData.clientId)
        if (!client || items.length === 0) return
        const subtotal = Number(items.reduce((s, i) => s + (Number(i.total) || 0), 0).toFixed(2))
        const discountAmount = Number(((subtotal * formData.discountPercent) / 100).toFixed(2))
        const taxable = Math.max(0, Number((subtotal - discountAmount).toFixed(2)))
        const taxAmount = Number(((taxable * formData.taxPercent) / 100).toFixed(2))
        const total = Number((taxable + taxAmount).toFixed(2))

        setIsSaving(true)
        const invNum = await invoiceStore.getNextInvoiceNumber()
        await invoiceStore.create({
            invoiceNumber: invNum,
            clientId: client.id, clientName: client.name, clientEmail: client.email, clientPhone: client.phone,
            date: new Date().toISOString().split('T')[0], items, subtotal,
            discountPercent: formData.discountPercent, discountAmount,
            taxPercent: formData.taxPercent, taxAmount, total, amountPaid: 0,
            status: 'draft', paymentMethod: formData.paymentMethod,
            branch: formData.branch, stylist: formData.stylist, notes: formData.notes,
        })
        setIsSaving(false)
        setShowForm(false)
        setItems([{ service: '', quantity: 1, unitPrice: 0, total: 0 }])
        setFormData({ clientId: '', discountPercent: 0, taxPercent: 5, paymentMethod: 'cash', branch: 'Belgaum', stylist: '', notes: '' })
        await reload()
    }

    return (
        <div>
            <div className="admin-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 className="admin-page-title">Invoices</h1>
                    <p className="admin-page-sub">Generate and manage client invoices</p>
                </div>
                <button className="admin-btn admin-btn-primary" onClick={() => setShowForm(!showForm)}>
                    <Plus size={14} /> New Invoice
                </button>
            </div>

            {/* Stats */}
            <div className="admin-stats-grid">
                <div className="admin-stat-card" style={{ borderTop: '2px solid rgba(255, 255, 255, 0.15)' }}><div className="stat-label">Total Invoices</div><div className="stat-value">{invoices.length}</div></div>
                <div className="admin-stat-card" style={{ borderTop: '2px solid rgba(16, 185, 129, 0.4)' }}><div className="stat-label">Revenue (Paid)</div><div className="stat-value green">₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></div>
                <div className="admin-stat-card" style={{ borderTop: outstanding > 0 ? '2px solid rgba(245, 158, 11, 0.4)' : '2px solid rgba(16, 185, 129, 0.4)' }}><div className="stat-label">Outstanding</div><div className="stat-value" style={{ color: outstanding > 0 ? 'var(--warning-light)' : 'var(--success-light)' }}>₹{outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></div>
            </div>

            {/* Create Invoice Form */}
            {showForm && (
                <div className="admin-form-card">
                    <h3>Create Invoice</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="admin-form-grid">
                            <div className="admin-form-group">
                                <label className="admin-form-label">Client *</label>
                                <select className="admin-form-select" value={formData.clientId} onChange={e => setFormData({ ...formData, clientId: e.target.value })} required>
                                    <option value="">Select client</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Branch</label>
                                {branchScope ? (
                                    <input className="admin-form-input" value={branchScope} disabled />
                                ) : (
                                    <select className="admin-form-select" value={formData.branch} onChange={e => setFormData({ ...formData, branch: e.target.value })}>
                                        <option value="Bengaluru">Bengaluru</option><option value="Kalaburagi">Kalaburagi</option>
                                    </select>
                                )}
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Stylist</label>
                                <input className="admin-form-input" value={formData.stylist} onChange={e => setFormData({ ...formData, stylist: e.target.value })} />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Payment Method</label>
                                <select className="admin-form-select" value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as Invoice['paymentMethod'] })}>
                                    <option value="cash">Cash</option><option value="card">Card</option><option value="upi">UPI</option><option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        {/* Line Items */}
                        <div style={{ marginTop: 20 }}>
                            <div className="admin-form-label" style={{ marginBottom: 10 }}>Services</div>
                            {items.map((item, idx) => (
                                <div key={idx} className="invoice-item-row">
                                    <select className="admin-form-select" value={item.service} onChange={e => updateItem(idx, 'service', e.target.value)} required>
                                        <option value="">Select service</option>
                                        {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                    </select>
                                    <input className="admin-form-input" type="number" min={1} value={item.quantity === 0 ? '' : item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value === '' ? 1 : parseInt(e.target.value) || 1)} onFocus={e => e.target.select()} placeholder="1" />
                                    <input className="admin-form-input" type="number" step="0.01" min={0} value={item.unitPrice === 0 ? '' : item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} onFocus={e => e.target.select()} placeholder="0" />
                                    <div style={{ fontWeight: 500, color: 'var(--accent)', fontSize: 13 }}>₹{Number(item.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    {items.length > 1 && <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setItems(items.filter((_, i) => i !== idx))}>×</button>}
                                </div>
                            ))}
                            <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setItems([...items, { service: '', quantity: 1, unitPrice: 0, total: 0 }])}>+ Add Item</button>
                        </div>

                        <div className="admin-form-grid" style={{ marginTop: 16 }}>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Discount (%)</label>
                                <input className="admin-form-input" type="number" step="0.1" min={0} max={100} value={formData.discountPercent === 0 ? '' : formData.discountPercent} onChange={e => setFormData({ ...formData, discountPercent: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })} onFocus={e => e.target.select()} placeholder="0" />
                            </div>
                            <div className="admin-form-group">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <label className="admin-form-label">GST (%)</label>
                                    <button
                                        type="button"
                                        className="admin-btn admin-btn-ghost admin-btn-sm"
                                        style={{ fontSize: 11, padding: '1px 6px', height: 20, color: formData.taxPercent > 0 ? '#ef4444' : '#10b981' }}
                                        onClick={() => setFormData({ ...formData, taxPercent: formData.taxPercent > 0 ? 0 : 5 })}
                                    >
                                        {formData.taxPercent > 0 ? '✕ Remove GST' : '+ Add GST (5%)'}
                                    </button>
                                </div>
                                <input className="admin-form-input" type="number" step="0.1" min={0} value={formData.taxPercent === 0 ? '' : formData.taxPercent} onChange={e => setFormData({ ...formData, taxPercent: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0 })} onFocus={e => e.target.select()} placeholder="0" />
                            </div>
                            <div className="admin-form-group full">
                                <label className="admin-form-label">Notes</label>
                                <textarea className="admin-form-textarea" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                            </div>
                        </div>
                        <div className="admin-form-actions">
                            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                            <button type="submit" className="admin-btn admin-btn-primary" disabled={isSaving}>{isSaving ? 'Creating...' : 'Create Invoice'}</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="admin-toolbar">
                <input className="admin-search" placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} />
                <select className="admin-filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option><option value="sent">Sent</option><option value="paid">Paid</option><option value="overdue">Overdue</option><option value="cancelled">Cancelled</option>
                </select>
            </div>

            {/* Table */}
            <div className="admin-table-wrapper mobile-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr><th>Invoice #</th><th>Client</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={7}><div className="admin-empty" style={{ padding: 32 }}><FileText size={28} className="admin-empty-icon" /><h3>No invoices found</h3></div></td></tr>
                        ) : filtered.map(inv => (
                            <tr key={inv.id}>
                                <td style={{ fontWeight: 500, color: 'var(--accent)' }}>{inv.invoiceNumber}</td>
                                <td>
                                    <div className="cell-primary" style={{ fontSize: 13 }}>{inv.clientName}</div>
                                    <div className="cell-secondary">{inv.clientEmail}</div>
                                </td>
                                <td>{new Date(inv.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                                <td className="cell-secondary">{inv.items.length} item{inv.items.length > 1 ? 's' : ''}</td>
                                <td style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>₹{inv.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td>
                                    <span className={`status-badge ${inv.status === 'paid' ? 'confirmed' : inv.status === 'sent' ? 'pending' : inv.status}`}>
                                        <span className="status-dot"></span>
                                        {inv.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="admin-actions">
                                        <button className="admin-btn admin-btn-ghost admin-btn-sm" title="View Bill" onClick={() => navigate(`/admin/invoices/${inv.id}`)}><Eye size={14} /></button>
                                        <button className="admin-btn admin-btn-ghost admin-btn-sm" title="Bluetooth Print (SEZNIK Veer)" onClick={() => navigate(`/admin/invoices/${inv.id}`)} style={{ color: '#0284c7' }}><Bluetooth size={14} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card List */}
            <div className="mobile-cards">
                {filtered.length === 0 ? (
                    <div className="admin-empty" style={{ padding: 32 }}>
                        <FileText size={28} className="admin-empty-icon" />
                        <h3>No invoices found</h3>
                    </div>
                ) : filtered.map(inv => (
                    <div className="mobile-card" key={inv.id}>
                        <div className="mobile-card-top">
                            <div className="mobile-card-heading">
                                <div>
                                    <div className="mobile-card-title" style={{ color: 'var(--accent)', cursor: 'pointer' }} onClick={() => navigate(`/admin/invoices/${inv.id}`)}>{inv.invoiceNumber}</div>
                                    <div className="mobile-card-sub">{inv.clientName}</div>
                                </div>
                            </div>
                            <span className={`status-badge ${inv.status === 'paid' ? 'confirmed' : inv.status === 'sent' ? 'pending' : inv.status}`}>
                                <span className="status-dot"></span>
                                {inv.status}
                            </span>
                        </div>
                        <div className="mobile-card-meta">
                            <div className="mobile-card-meta-item">
                                <span className="mobile-card-meta-label">Date</span>
                                <span>{new Date(inv.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                            </div>
                            <div className="mobile-card-meta-item">
                                <span className="mobile-card-meta-label">Items</span>
                                <span>{inv.items.length} item{inv.items.length > 1 ? 's' : ''}</span>
                            </div>
                            <div className="mobile-card-meta-item full">
                                <span className="mobile-card-meta-label">Total</span>
                                <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>₹{inv.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                        <div className="mobile-card-actions" style={{ justifyContent: 'flex-end', gap: 6 }}>
                            <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => navigate(`/admin/invoices/${inv.id}`)} title="View Bill"><Eye size={16} /></button>
                            <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => navigate(`/admin/invoices/${inv.id}`)} title="Bluetooth Print (SEZNIK Veer)" style={{ color: '#0284c7' }}><Bluetooth size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Export Router Switch ────────────────────────────────────
export { InvoiceList, InvoiceDetail }
