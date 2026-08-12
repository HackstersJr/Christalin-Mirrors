import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Search, FileText, ArrowLeft, Printer, Eye, Download } from 'lucide-react'
import { invoiceStore, clientStore, serviceStore } from '../data/store'
import { getBranchScope, scopeByBranch } from '../data/authStore'
import type { Invoice, InvoiceItem } from '../data/types'
import cmLogo from '../../assets/cm-logo-white.png'
import '../AdminShared.css'
import './Billing.css'

// html2canvas doesn't honor CSS `filter` (used on-screen to flip the white
// logo artwork to black), so the captured image shows the raw white/cream
// logo artwork, which blends into the white receipt. Bake a real black
// silhouette instead by re-drawing the logo's alpha shape filled with black
// on an offscreen canvas. Drawing the already-loaded, already-rendered <img>
// element directly (rather than re-fetching the src into a new Image) avoids
// a same-origin resource being re-requested with different CORS handling,
// which can silently taint the canvas and produce no output at all.
function blackenLogo(imgEl: HTMLImageElement): string | null {
    const canvas = document.createElement('canvas')
    canvas.width = imgEl.naturalWidth
    canvas.height = imgEl.naturalHeight
    const ctx = canvas.getContext('2d')
    if (!ctx || canvas.width === 0) return null
    ctx.drawImage(imgEl, 0, 0)
    ctx.globalCompositeOperation = 'source-in'
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/png')
}

async function captureInvoiceCanvas(html2canvas: typeof import('html2canvas').default) {
    const node = document.getElementById('invoice-print')
    if (!node) return null

    const logoImg = node.querySelector<HTMLImageElement>('.preview-brand-logo')
    const originalSrc = logoImg?.getAttribute('src') || null
    const blackened = logoImg ? blackenLogo(logoImg) : null
    if (logoImg && blackened) {
        logoImg.src = blackened
        await logoImg.decode().catch(() => {}) // ensure the swapped image is painted before capture
    }

    try {
        return await html2canvas(node, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
    } finally {
        if (logoImg && originalSrc) logoImg.src = originalSrc
    }
}

async function downloadInvoicePdf(invoice: Invoice) {
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
    ])
    const canvas = await captureInvoiceCanvas(html2canvas)
    if (!canvas) return
    const imgData = canvas.toDataURL('image/png')

    // Size the PDF page to the receipt itself (single page, 1:1) instead of
    // forcing it into A4 — stretching a narrow receipt to A4 width made it
    // taller than one page, which split the content across a page break.
    const pdf = new jsPDF({
        orientation: canvas.height >= canvas.width ? 'portrait' : 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
    })
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
    pdf.save(`${invoice.invoiceNumber}.pdf`)
}

// ─── Invoice Detail View ────────────────────────────────────
function InvoiceDetail() {
    const { invoiceId } = useParams<{ invoiceId: string }>()
    const navigate = useNavigate()
    const [invoice, setInvoice] = useState<Invoice | null>(null)

    useEffect(() => {
        if (invoiceId) {
            invoiceStore.getById(invoiceId).then(inv => setInvoice(inv || null))
        }
    }, [invoiceId])

    if (!invoice) {
        return <div className="admin-empty" style={{ padding: 60 }}>
            <h3>Invoice not found</h3>
            <button className="admin-btn admin-btn-primary" onClick={() => navigate('/admin/invoices')}>Back</button>
        </div>
    }

    const handlePrint = () => { window.print() }

    const updateStatus = async (status: Invoice['status']) => {
        await invoiceStore.update(invoice.id, { status })
        setInvoice({ ...invoice, status })
    }

    const buildWhatsAppText = () => {
        let text = `*Christalin Mirrors - Invoice ${invoice.invoiceNumber}*\n`;
        text += `Date: ${new Date(invoice.date + 'T00:00:00').toLocaleDateString('en-IN')}\n`;
        text += `Client: ${invoice.clientName}\n\n`;
        invoice.items.forEach(i => {
            if(i.service) text += `${i.service} (x${i.quantity}) - ₹${i.total}\n`;
        });
        text += `\nSubtotal: ₹${invoice.subtotal}\n`;
        if (invoice.discountAmount > 0) text += `Discount: -₹${invoice.discountAmount}\n`;
        text += `CGST (${invoice.taxPercent / 2}%): ₹${Math.floor(invoice.taxAmount / 2)}\n`;
        text += `SGST (${invoice.taxPercent / 2}%): ₹${invoice.taxAmount - Math.floor(invoice.taxAmount / 2)}\n`;
        text += `*Total: ₹${invoice.total}*\n\n`;
        text += `Thank you for your visit!`;
        return text;
    }

    // WhatsApp's wa.me link only supports pre-filled text — there's no URL
    // parameter for attaching a file. To actually send the bill image, we
    // use the Web Share API (supported on Android/Chrome and most mobile
    // browsers), which hands the image to the native share sheet where
    // WhatsApp appears as a real target with the file attached. Falls back
    // to the old text-only wa.me link where file sharing isn't supported
    // (e.g. desktop browsers).
    const shareWhatsApp = async () => {
        if (!invoice) return;
        const text = buildWhatsAppText();

        try {
            const { default: html2canvas } = await import('html2canvas')
            const canvas = await captureInvoiceCanvas(html2canvas)
            if (canvas) {
                const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
                if (blob) {
                    const file = new File([blob], `${invoice.invoiceNumber}.png`, { type: 'image/png' })
                    if (navigator.canShare?.({ files: [file] })) {
                        await navigator.share({ files: [file], title: invoice.invoiceNumber, text })
                        return
                    }
                }
            }
        } catch (err) {
            if ((err as Error)?.name === 'AbortError') return // user cancelled the share sheet
        }

        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }

    return (
        <div>
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
                <button className="admin-btn admin-btn-ghost" onClick={() => navigate('/admin/invoices')}>
                    <ArrowLeft size={18} />
                </button>
                <div style={{ flex: 1, minWidth: 140 }}>
                    <h1 className="admin-page-title" style={{ marginBottom: 0 }}>{invoice.invoiceNumber}</h1>
                    <p className="admin-page-sub">Invoice for {invoice.clientName}</p>
                </div>
                <span className={`status-badge ${invoice.status === 'paid' ? 'confirmed' : invoice.status === 'sent' ? 'pending' : invoice.status}`}>{invoice.status}</span>
                <button className="admin-btn admin-btn-whatsapp" onClick={shareWhatsApp}>Share on WhatsApp</button>
                <button className="admin-btn admin-btn-secondary" onClick={() => downloadInvoicePdf(invoice)}><Download size={14} /> Download</button>
                <button className="admin-btn admin-btn-secondary" onClick={handlePrint}><Printer size={14} /> Print</button>
            </div>

            {/* Invoice Card — mirrors the Billing "Bill Preview" receipt style */}
            <div className="preview-receipt" id="invoice-print" style={{ position: 'static', boxShadow: 'none', border: '1px solid var(--border-color)' }}>
                <div className="preview-header">Tax Invoice</div>

                <img src={cmLogo} alt="Christalin Mirrors" className="preview-brand-logo" />
                <div className="preview-salon-name" style={{ marginBottom: 4 }}>Christalin Mirrors</div>
                <div className="preview-branch-line">
                    {invoice.branch}<br />GSTIN: 29AAVFC4475G1ZU
                </div>

                <div className="preview-meta">
                    <div>{invoice.invoiceNumber} • {new Date(invoice.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    {invoice.stylist && <div style={{ fontSize: 12, marginTop: 4 }}>Stylist: {invoice.stylist}</div>}
                    <div className="preview-client">{invoice.clientName}</div>
                    {invoice.clientPhone && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{invoice.clientPhone}</div>}
                </div>

                <div className="preview-items">
                    {invoice.items.map((item, i) => item.service ? (
                        <div key={i} className="preview-row">
                            <div className="preview-row-name">
                                {item.service}
                                <div className="preview-row-qty">{item.quantity} × ₹{item.unitPrice.toLocaleString()}</div>
                            </div>
                            <div className="preview-row-total">₹{item.total.toLocaleString()}</div>
                        </div>
                    ) : null)}
                </div>

                <div className="preview-totals">
                    <div className="preview-sub">
                        <span>Subtotal</span><span>₹{invoice.subtotal.toLocaleString()}</span>
                    </div>
                    {invoice.discountAmount > 0 && (
                        <div className="preview-discount">
                            <span>Discount ({invoice.discountPercent}%)</span><span>-₹{invoice.discountAmount.toLocaleString()}</span>
                        </div>
                    )}
                    <div className="preview-tax">
                        <span>CGST ({invoice.taxPercent / 2}%)</span><span>₹{Math.floor(invoice.taxAmount / 2).toLocaleString()}</span>
                    </div>
                    <div className="preview-tax">
                        <span>SGST ({invoice.taxPercent / 2}%)</span><span>₹{(invoice.taxAmount - Math.floor(invoice.taxAmount / 2)).toLocaleString()}</span>
                    </div>
                    <div className="preview-grand-total">
                        <span>Total</span><span>₹{invoice.total.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                        <span>Amount Paid</span><span>₹{invoice.amountPaid.toLocaleString()}</span>
                    </div>
                    {invoice.total - invoice.amountPaid > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 13, fontWeight: 600, color: 'var(--danger)' }}>
                            <span>Balance Due</span><span>₹{(invoice.total - invoice.amountPaid).toLocaleString()}</span>
                        </div>
                    )}
                </div>

                {invoice.notes && (
                    <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                        <strong>Notes:</strong> {invoice.notes}
                    </div>
                )}

                <div className="preview-footer">
                    {invoice.paymentMethod && <span className="preview-payment-badge">{invoice.paymentMethod}</span>}
                    <div className="preview-watermark">Christalin Mirrors — {invoice.branch}</div>
                </div>
            </div>

            {/* Actions */}
            <div className="no-print" style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap', maxWidth: 420, margin: '16px auto 0' }}>
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
            if (svc) { updated[idx].unitPrice = svc.price; updated[idx].total = svc.price * updated[idx].quantity }
        }
        if (field === 'quantity' || field === 'unitPrice') {
            updated[idx].total = updated[idx].unitPrice * updated[idx].quantity
        }
        setItems(updated)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const client = clients.find(c => c.id === formData.clientId)
        if (!client || items.length === 0) return
        const subtotal = items.reduce((s, i) => s + i.total, 0)
        const discountAmount = Math.round(subtotal * formData.discountPercent / 100)
        const taxable = subtotal - discountAmount
        const taxAmount = Math.round(taxable * formData.taxPercent / 100)
        const total = taxable + taxAmount

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
        setShowForm(false)
        setItems([{ service: '', quantity: 1, unitPrice: 0, total: 0 }])
        setFormData({ clientId: '', discountPercent: 0, taxPercent: 5, paymentMethod: 'cash', branch: 'Bengaluru', stylist: '', notes: '' })
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
                <div className="admin-stat-card" style={{ borderTop: '2px solid rgba(16, 185, 129, 0.4)' }}><div className="stat-label">Revenue (Paid)</div><div className="stat-value green">₹{totalRevenue.toLocaleString()}</div></div>
                <div className="admin-stat-card" style={{ borderTop: outstanding > 0 ? '2px solid rgba(245, 158, 11, 0.4)' : '2px solid rgba(16, 185, 129, 0.4)' }}><div className="stat-label">Outstanding</div><div className="stat-value" style={{ color: outstanding > 0 ? 'var(--warning-light)' : 'var(--success-light)' }}>₹{outstanding.toLocaleString()}</div></div>
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
                                    <input className="admin-form-input" type="number" min={1} value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} />
                                    <input className="admin-form-input" type="number" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', parseInt(e.target.value) || 0)} />
                                    <div style={{ fontWeight: 500, color: 'var(--accent)', fontSize: 13 }}>₹{item.total.toLocaleString()}</div>
                                    {items.length > 1 && <button type="button" className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setItems(items.filter((_, i) => i !== idx))}>×</button>}
                                </div>
                            ))}
                            <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setItems([...items, { service: '', quantity: 1, unitPrice: 0, total: 0 }])}>+ Add Item</button>
                        </div>

                        <div className="admin-form-grid" style={{ marginTop: 16 }}>
                            <div className="admin-form-group">
                                <label className="admin-form-label">Discount (%)</label>
                                <input className="admin-form-input" type="number" min={0} max={100} value={formData.discountPercent} onChange={e => setFormData({ ...formData, discountPercent: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-form-label">GST (%)</label>
                                <input className="admin-form-input" type="number" min={0} value={formData.taxPercent} onChange={e => setFormData({ ...formData, taxPercent: parseInt(e.target.value) || 0 })} />
                            </div>
                            <div className="admin-form-group full">
                                <label className="admin-form-label">Notes</label>
                                <textarea className="admin-form-textarea" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                            </div>
                        </div>
                        <div className="admin-form-actions">
                            <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                            <button type="submit" className="admin-btn admin-btn-primary">Create Invoice</button>
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
                                <td style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>₹{inv.total.toLocaleString()}</td>
                                <td>
                                    <span className={`status-badge ${inv.status === 'paid' ? 'confirmed' : inv.status === 'sent' ? 'pending' : inv.status}`}>
                                        <span className="status-dot"></span>
                                        {inv.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="admin-actions">
                                        <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => navigate(`/admin/invoices/${inv.id}`)}><Eye size={14} /></button>
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
                                <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>₹{inv.total.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="mobile-card-actions" style={{ justifyContent: 'flex-end' }}>
                            <button className="admin-btn admin-btn-ghost" onClick={() => navigate(`/admin/invoices/${inv.id}`)}><Eye size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Export Router Switch ────────────────────────────────────
export { InvoiceList, InvoiceDetail }
