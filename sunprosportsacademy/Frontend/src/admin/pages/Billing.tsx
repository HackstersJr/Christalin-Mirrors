import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Plus, Trash2, Printer, Check, ArrowRight, X, Receipt,
    User, Scissors, Package, Percent, CreditCard, Banknote, ShieldCheck, ChevronDown
} from 'lucide-react';
import {
    clientStore, serviceStore, staffStore, appointmentStore,
    inventoryStore, invoiceStore, settingsStore
} from '../data/store';
import type { Client, ServiceRecord, StaffMember, Appointment, InventoryItem, InvoiceItem, Invoice } from '../data/types';
import { useToast } from '../components/Toast';
import '../AdminShared.css';
import './Billing.css';

export default function Billing() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Data Sources
    const [clients, setClients] = useState<Client[]>([]);
    const [services, setServices] = useState<ServiceRecord[]>([]);
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);

    useEffect(() => {
        setClients(clientStore.getAll());
        setServices(serviceStore.getAll().filter(s => s.isActive));
        setStaff(staffStore.getAll().filter(s => s.isActive));
        setInventory(inventoryStore.getAll().filter(i => i.isActive));
        
        const today = new Date().toISOString().split('T')[0];
        setAppointments(appointmentStore.getAll().filter(a => a.date === today && a.status === 'confirmed'));
    }, []);

    // Branch selector (Fix 8)
    const branches = settingsStore.get().branches.filter(b => b.isActive);
    const [selectedBranch, setSelectedBranch] = useState<string>(branches[0]?.name || 'Bengaluru');

    // Form State
    const [selectedClient, setSelectedClient] = useState<Client | null | 'walk-in'>(null);
    const [clientSearch, setClientSearch] = useState('');
    const [clientSearchFocused, setClientSearchFocused] = useState(false);
    const [showNewClientForm, setShowNewClientForm] = useState(false);
    const [newClient, setNewClient] = useState({ name: '', phone: '', gender: 'female' as Client['gender'] });

    const [selectedStaffId, setSelectedStaffId] = useState<string>('');
    const [items, setItems] = useState<InvoiceItem[]>([]);
    
    // Discount & Tax
    const [discountType, setDiscountType] = useState<'percent' | 'flat'>('percent');
    const [discountValue, setDiscountValue] = useState<number>(0);
    const [taxPercent, setTaxPercent] = useState<number>(18);
    
    // Payment
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'upi'>('cash');
    const [amountReceived, setAmountReceived] = useState<number>(0);
    const [upiRef, setUpiRef] = useState('');
    const [cardLast4, setCardLast4] = useState('');
    const [notes, setNotes] = useState('');

    // Modals & Flows
    const [showPayModal, setShowPayModal] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('');
    const [showAppointmentShortcut, setShowAppointmentShortcut] = useState(false);

    // Derived Financials
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = discountType === 'percent' ? Math.round(subtotal * (discountValue / 100)) : discountValue;
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = Math.round(taxableAmount * (taxPercent / 100));
    const total = taxableAmount + taxAmount;
    const changeToReturn = amountReceived - total;

    // Derived Client Search
    const filteredClients = useMemo(() => {
        if (!clientSearch) return clients.slice(0, 5); // Show top 5 normally
        const term = clientSearch.toLowerCase();
        return clients.filter(c => c.name.toLowerCase().includes(term) || c.phone.includes(term)).slice(0, 10);
    }, [clients, clientSearch]);

    const handleCreateClient = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newClient.name || !newClient.phone) return;
        const created = clientStore.create({
            name: newClient.name,
            phone: newClient.phone,
            gender: newClient.gender,
            email: '',
            branch: selectedBranch,
            joinedDate: new Date().toISOString().split('T')[0],
            totalVisits: 0,
            tags: ['New']
        });
        setClients(clientStore.getAll());
        setSelectedClient(created);
        setShowNewClientForm(false);
        setNewClient({ name: '', phone: '', gender: 'female' });
        setClientSearch('');
    };

    const addServiceItem = () => setItems([...items, { service: '', quantity: 1, unitPrice: 0, total: 0 }]);
    const addProductItem = () => setItems([...items, { service: '', description: 'Product', quantity: 1, unitPrice: 0, total: 0 }]);

    const updateItem = (idx: number, field: keyof InvoiceItem, val: string | number) => {
        const copy = [...items];
        copy[idx] = { ...copy[idx], [field]: val };
        
        if (field === 'service') {
            const svc = services.find(s => s.name === val);
            const prd = inventory.find(p => p.name === val);
            if (svc) {
                copy[idx].unitPrice = svc.price;
                copy[idx].description = '';
                copy[idx].productId = undefined;
            } else if (prd) {
                copy[idx].unitPrice = prd.retailPrice || 0;
                copy[idx].description = 'Product';
                copy[idx].productId = prd.id;
            }
        }
        
        if (['quantity', 'unitPrice', 'service'].includes(field)) {
            copy[idx].total = copy[idx].unitPrice * copy[idx].quantity;
        }
        setItems(copy);
    };

    const removeItem = (idx: number) => {
        setItems(items.filter((_, i) => i !== idx));
    };

    const applyAppointment = (apt: Appointment) => {
        // Find existing client or set walk-in logic
        const c = clients.find(cl => cl.name === apt.clientName);
        setSelectedClient(c ? c : 'walk-in');
        
        // Find stylist
        const s = staff.find(st => st.name === apt.stylist);
        if (s) setSelectedStaffId(s.id);

        // Find service
        const svc = services.find(sv => sv.name === apt.service);
        if (svc) {
            setItems([{ service: svc.name, quantity: 1, unitPrice: svc.price, total: svc.price }]);
        }

        // Track the appointment ID so we can mark it completed (Fix 2)
        setSelectedAppointmentId(apt.id);
    };

    const saveInvoice = (status: 'draft' | 'paid') => {
        let clientId = '';
        let clientName = 'Walk-in Guest';
        let clientEmail = '';
        let clientPhone = '';

        if (selectedClient && selectedClient !== 'walk-in') {
            clientId = selectedClient.id;
            clientName = selectedClient.name;
            clientEmail = selectedClient.email;
            clientPhone = selectedClient.phone;
        }

        const stylistName = staff.find(s => s.id === selectedStaffId)?.name || '';

        const inv = invoiceStore.create({
            invoiceNumber: invoiceStore.getNextInvoiceNumber(),
            clientId,
            clientName,
            clientEmail,
            clientPhone,
            date: new Date().toISOString().split('T')[0],
            items,
            subtotal,
            discountPercent: discountType === 'percent' ? discountValue : 0,
            discountAmount,
            taxPercent,
            taxAmount,
            total,
            amountPaid: status === 'paid' ? total : 0,
            status,
            paymentMethod,
            branch: selectedBranch,
            stylist: stylistName,
            notes: notes + (paymentMethod === 'upi' ? ` (Ref: ${upiRef})` : '') + (paymentMethod === 'card' ? ` (Card: *${cardLast4})` : ''),
            appointmentId: selectedAppointmentId || undefined,
        });

        if (status === 'paid' && selectedClient && selectedClient !== 'walk-in') {
            clientStore.update(selectedClient.id, { 
                totalVisits: selectedClient.totalVisits + 1,
                lastVisit: new Date().toISOString().split('T')[0]
            });
        }

        return inv;
    };

    const handleSaveDraft = () => {
        if (!selectedClient || items.length === 0) { showToast('error', 'Select client and add items first'); return; }
        if (!selectedStaffId) { showToast('error', 'Please select a stylist/therapist'); return; }
        saveInvoice('draft');
        showToast('success', 'Draft saved successfully');
        navigate('/admin/invoices');
    };

    const confirmPayment = () => {
        if (!selectedClient || items.length === 0) { showToast('error', 'Select client and add items first'); return; }
        if (!selectedStaffId) { showToast('error', 'Please select a stylist/therapist'); return; }
        const inv = saveInvoice('paid');
        setLastInvoice(inv);
        setShowPayModal(false);
        setShowSuccess(true);

        // Fix 1: Decrement inventory stock for retail product items
        items.forEach(item => {
            if (item.productId) {
                const product = inventoryStore.getById(item.productId);
                if (product) {
                    const newStock = Math.max(0, product.currentStock - item.quantity);
                    inventoryStore.update(item.productId, { currentStock: newStock });
                }
            }
        });

        // Fix 2: Mark appointment as completed if bill was from an appointment
        if (selectedAppointmentId) {
            appointmentStore.update(selectedAppointmentId, { status: 'completed' });
        }
        
        // Auto reset after 30 seconds
        setTimeout(() => {
            if (document.getElementById('success-screen')) {
                resetBilling();
            }
        }, 30000);
    };

    const resetBilling = () => {
        setSelectedClient(null);
        setClientSearch('');
        setSelectedStaffId('');
        setItems([]);
        setDiscountType('percent');
        setDiscountValue(0);
        setTaxPercent(18);
        setPaymentMethod('cash');
        setAmountReceived(0);
        setUpiRef('');
        setCardLast4('');
        setNotes('');
        setSelectedAppointmentId('');
        setShowSuccess(false);
        setLastInvoice(null);
    };

    const shareWhatsApp = () => {
        if (!lastInvoice) return;
        let text = `*Christalin Mirrors - Invoice ${lastInvoice.invoiceNumber}*\n`;
        text += `Date: ${new Date().toLocaleDateString('en-IN')}\n`;
        text += `Client: ${lastInvoice.clientName}\n\n`;
        lastInvoice.items.forEach(i => {
            text += `${i.service} (x${i.quantity}) - ₹${i.total}\n`;
        });
        text += `\nSubtotal: ₹${lastInvoice.subtotal}\n`;
        if (lastInvoice.discountAmount > 0) text += `Discount: -₹${lastInvoice.discountAmount}\n`;
        text += `GST: ₹${lastInvoice.taxAmount}\n`;
        text += `*Total: ₹${lastInvoice.total}*\n\n`;
        text += `Thank you for your visit!`;
        
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    if (showSuccess && lastInvoice) {
        return (
            <div id="success-screen" className="billing-success-wrapper">
                <div className="billing-success-content">
                    <div className="success-icon-wrapper"><Check size={64} className="success-icon" /></div>
                    <h1 className="success-title">Payment Confirmed</h1>
                    <div className="success-amount">₹{lastInvoice.total.toLocaleString()}</div>
                    <p className="success-meta">{lastInvoice.clientName} • {lastInvoice.invoiceNumber}</p>
                    
                    <div className="success-actions">
                        <button className="admin-btn admin-btn-secondary" onClick={() => window.open(`/admin/invoices/${lastInvoice.id}`, '_blank')}><Printer size={16} /> Print Bill</button>
                        <button className="admin-btn admin-btn-whatsapp" onClick={shareWhatsApp}>Share on WhatsApp</button>
                    </div>
                    
                    <button className="admin-btn admin-btn-primary" style={{ marginTop: 20, width: '100%' }} onClick={resetBilling}><Plus size={16} /> New Bill</button>
                    <p style={{ marginTop: 20, fontSize: 13, color: 'var(--text-dim)' }}>Automatically resetting in 30 seconds...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="billing-container">
            {/* LEFT COLUMN - BUILDER */}
            <div className="billing-builder">
                <div className="admin-page-header" style={{ marginBottom: 20 }}>
                    <h1 className="admin-page-title">Point of Sale</h1>
                    <p className="admin-page-sub">Create bill and collect payment</p>
                </div>

                {/* Branch Selector (Fix 8) */}
                <div className="billing-section" style={{ paddingBottom: 10 }}>
                    <div className="billing-section-header"><h3>Branch</h3></div>
                    <select className="admin-form-select" value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
                        {branches.length > 0 ? branches.map(b => (
                            <option key={b.name} value={b.name}>{b.name}</option>
                        )) : (
                            <>
                                <option value="Bengaluru">Bengaluru</option>
                                <option value="Kalaburagi">Kalaburagi</option>
                            </>
                        )}
                    </select>
                </div>

                {/* Section 1: Client */}
                <div className="billing-section billing-section--client">
                    <div className="billing-section-header">
                        <h3><User size={16} /> Client Registration</h3>
                        {!showNewClientForm && <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setShowNewClientForm(true)}>+ New Client</button>}
                    </div>
                    
                    {showNewClientForm ? (
                        <form className="billing-inline-form" onSubmit={handleCreateClient}>
                            <input className="admin-form-input" placeholder="Name *" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} required autoFocus />
                            <input className="admin-form-input" placeholder="Phone *" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} required />
                            <select className="admin-form-select" value={newClient.gender} onChange={e => setNewClient({...newClient, gender: e.target.value as Client['gender']})}>
                                <option value="female">Female</option>
                                <option value="male">Male</option>
                                <option value="other">Other</option>
                            </select>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm">Save</button>
                                <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setShowNewClientForm(false)}>Cancel</button>
                            </div>
                        </form>
                    ) : (
                        <div className="billing-client-selector">
                            {selectedClient ? (
                                <div className="billing-selected-client">
                                    <div className="client-info-main">
                                        <div className="client-avatar">
                                            {selectedClient === 'walk-in' ? 'W' : selectedClient.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 16 }}>{selectedClient === 'walk-in' ? 'Walk-in Guest' : selectedClient.name}</div>
                                            {selectedClient !== 'walk-in' && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selectedClient.phone} • {selectedClient.totalVisits} visits</div>}
                                        </div>
                                    </div>
                                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => setSelectedClient(null)}><X size={16} /></button>
                                </div>
                            ) : (
                                <div style={{ position: 'relative' }}>
                                    <input 
                                        className="admin-form-input" 
                                        placeholder="Search client by name or phone..." 
                                        value={clientSearch}
                                        onChange={e => setClientSearch(e.target.value)}
                                        onFocus={() => setClientSearchFocused(true)}
                                        onBlur={() => setTimeout(() => setClientSearchFocused(false), 200)}
                                        style={{ paddingLeft: 36 }}
                                    />
                                    <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
                                    
                                    {clientSearchFocused && (
                                        <div className="billing-search-results">
                                            <div className="billing-search-item walk-in" onClick={() => setSelectedClient('walk-in')}>
                                                <strong>Walk-in Guest</strong>
                                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>No profile tracking</span>
                                            </div>
                                            {filteredClients.map(c => (
                                                <div key={c.id} className="billing-search-item" onClick={() => { setSelectedClient(c); setClientSearchFocused(false); }}>
                                                    <div style={{ fontWeight: 500 }}>{c.name}</div>
                                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.phone}</div>
                                                    {c.tags.includes('VIP') && <span className="vip-badge">⭐ VIP</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {selectedClient && selectedClient !== 'walk-in' && selectedClient.tags.includes('VIP') && (
                                <div className="billing-vip-alert">⭐ VIP Client — check for loyalty discount</div>
                            )}
                        </div>
                    )}
                </div>

                {/* Section 2: Assign Staff */}
                <div className="billing-section">
                    <div className="billing-section-header">
                        <h3><Scissors size={16} /> Assign Stylist/Therapist</h3>
                    </div>
                    <select className="admin-form-select" value={selectedStaffId} onChange={e => setSelectedStaffId(e.target.value)}>
                        <option value="">Select staff *</option>
                        {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({s.role})</option>)}
                    </select>
                </div>

                {/* Section 4: Appointment Shortcut (Fix 10: Collapsible) */}
                <div className="billing-section">
                    <div className="billing-section-header" style={{ cursor: 'pointer' }} onClick={() => setShowAppointmentShortcut(!showAppointmentShortcut)}>
                        <h3>⚡ From Today's Appointment</h3>
                        <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: showAppointmentShortcut ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--text-muted)' }} />
                    </div>
                    {showAppointmentShortcut && (
                        <>
                    {appointments.length === 0 ? (
                        <div className="billing-appointment-empty">No confirmed appointments today</div>
                    ) : (
                        <div className="billing-appointments-list">
                            {appointments.map(apt => (
                                <div key={apt.id} className="billing-appointment-card" onClick={() => applyAppointment(apt)}>
                                    <div style={{ fontWeight: 500 }}>{apt.clientName}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{apt.time} • {apt.service} • {apt.stylist || 'Any'}</div>
                                    <ArrowRight size={14} className="apt-arrow" />
                                </div>
                            ))}
                        </div>
                    )}
                        </>
                    )}
                </div>

                {/* Section 3: Services & Items */}
                <div className="billing-section">
                    <div className="billing-section-header"><h3><Receipt size={16} /> Services & Products</h3></div>
                    
                    <div className="billing-items-list">
                        {items.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>No items added yet.</div>}
                        
                        {items.map((item, idx) => (
                            <div key={idx} className="billing-item-row">
                                <div style={{ flex: 2 }}>
                                    <select 
                                        className="admin-form-select" 
                                        value={item.service} 
                                        onChange={e => updateItem(idx, 'service', e.target.value)}
                                        style={{ borderLeft: item.description === 'Product' ? '3px solid #10b981' : '3px solid #3b82f6' }}
                                    >
                                        <option value="">Select an item...</option>
                                        <optgroup label="Services">
                                            {services.map(s => <option key={`svc-${s.id}`} value={s.name}>{s.name} (₹{s.price})</option>)}
                                        </optgroup>
                                        <optgroup label="Products">
                                            {inventory.map(p => <option key={`prd-${p.id}`} value={p.name}>{p.name} (₹{p.retailPrice})</option>)}
                                        </optgroup>
                                    </select>
                                </div>
                                <div style={{ width: 80 }}>
                                    <input className="admin-form-input" type="number" min={1} value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} placeholder="Qty" />
                                </div>
                                <div style={{ width: 100 }}>
                                    <input className="admin-form-input" type="number" min={0} value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', parseInt(e.target.value) || 0)} placeholder="Price" />
                                </div>
                                <div className="billing-item-total">₹{item.total.toLocaleString()}</div>
                                <button className="billing-item-remove" onClick={() => removeItem(idx)}><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>

                    <div className="billing-item-actions">
                        <button className="admin-btn admin-btn-secondary admin-btn-sm" onClick={addServiceItem}><Plus size={14} /> Add Service</button>
                        <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={addProductItem}><Package size={14} /> Add Retail Product</button>
                    </div>
                </div>

                {/* Section 5: Discount & Taxes */}
                <div className="billing-section half-split">
                    <div>
                        <div className="billing-section-header"><h3><Percent size={16} /> Discount</h3></div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <select className="admin-form-select" style={{ width: 100 }} value={discountType} onChange={e => setDiscountType(e.target.value as 'percent'|'flat')}>
                                <option value="percent">% Off</option>
                                <option value="flat">₹ Flat</option>
                            </select>
                            <input className="admin-form-input" type="number" min={0} value={discountValue} onChange={e => setDiscountValue(parseInt(e.target.value) || 0)} placeholder="0" />
                        </div>
                    </div>
                    <div>
                        <div className="billing-section-header"><h3>GST (%)</h3></div>
                        <input className="admin-form-input" type="number" min={0} value={taxPercent} onChange={e => setTaxPercent(parseInt(e.target.value) || 0)} />
                        <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>Applied post-discount</div>
                    </div>
                </div>

                {/* Section 6: Payment Method */}
                <div className="billing-section">
                    <div className="billing-section-header"><h3>Payment Method</h3></div>
                    <div className="billing-payment-toggles">
                        <div className={`payment-toggle ${paymentMethod === 'cash' ? 'active' : ''}`} onClick={() => setPaymentMethod('cash')}>
                            <Banknote size={20} /> Cash
                        </div>
                        <div className={`payment-toggle ${paymentMethod === 'card' ? 'active' : ''}`} onClick={() => setPaymentMethod('card')}>
                            <CreditCard size={20} /> Card
                        </div>
                        <div className={`payment-toggle ${paymentMethod === 'upi' ? 'active' : ''}`} onClick={() => setPaymentMethod('upi')}>
                            <ShieldCheck size={20} /> UPI
                        </div>
                    </div>

                    <div className="billing-payment-extras">
                        {paymentMethod === 'cash' && (
                            <div className="payment-extra-card">
                                <label>Amount Received (₹)</label>
                                <input className="admin-form-input large-input" type="number" value={amountReceived} onChange={e => setAmountReceived(parseInt(e.target.value) || 0)} placeholder={total.toString()} />
                                {changeToReturn > 0 && <div className="payment-change">Change to return: <strong>₹{changeToReturn}</strong></div>}
                            </div>
                        )}
                        {paymentMethod === 'upi' && (
                            <div className="payment-extra-card">
                                <label>UPI Reference ID (Optional)</label>
                                <input className="admin-form-input" value={upiRef} onChange={e => setUpiRef(e.target.value)} placeholder="e.g. 123456789012" />
                            </div>
                        )}
                        {paymentMethod === 'card' && (
                            <div className="payment-extra-card">
                                <label>Card Last 4 Digits (Optional)</label>
                                <input className="admin-form-input" value={cardLast4} onChange={e => setCardLast4(e.target.value)} placeholder="e.g. 4242" maxLength={4} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Section 7: Notes */}
                <div className="billing-section">
                    <textarea className="admin-form-textarea" placeholder="Add a note for this bill..." value={notes} onChange={e => setNotes(e.target.value)} style={{ minHeight: 60 }} />
                </div>

                {/* Action Buttons */}
                <div className="billing-main-actions">
                    <button className="admin-btn admin-btn-secondary" onClick={handleSaveDraft}>Save as Draft</button>
                    <button className="admin-btn admin-btn-primary premium-btn" onClick={() => setShowPayModal(true)}>⚡ Collect Payment - ₹{total.toLocaleString()}</button>
                </div>
            </div>

            {/* RIGHT COLUMN - LIVE PREVIEW */}
            <div className="billing-preview">
                <div className="preview-receipt">
                    <div className="preview-header">Bill Preview</div>
                    
                    <div className="preview-brand">CM</div>
                    <div className="preview-salon-name">Christalin Mirrors</div>
                    
                    <div className="preview-meta">
                        <div>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        <div className="preview-client">
                            {selectedClient === 'walk-in' ? 'Walk-in Guest' : selectedClient ? selectedClient.name : 'Select Client...'}
                        </div>
                        {selectedStaffId && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Stylist: {staff.find(s => s.id === selectedStaffId)?.name}</div>}
                    </div>

                    <div className="preview-items">
                        {items.length === 0 && <div className="preview-empty">No items...</div>}
                        {items.map((item, idx) => item.service ? (
                            <div key={idx} className="preview-row">
                                <div className="preview-row-name">
                                    {item.service}
                                    <div className="preview-row-qty">{item.quantity} × ₹{item.unitPrice}</div>
                                </div>
                                <div className="preview-row-total">₹{item.total.toLocaleString()}</div>
                            </div>
                        ) : null)}
                    </div>

                    <div className="preview-totals">
                        <div className="preview-sub">
                            <span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span>
                        </div>
                        {discountAmount > 0 && (
                            <div className="preview-discount">
                                <span>Discount</span><span>-₹{discountAmount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="preview-tax">
                            <span>GST ({taxPercent}%)</span><span>₹{taxAmount.toLocaleString()}</span>
                        </div>
                        <div className="preview-grand-total">
                            <span>Total</span><span>₹{total.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="preview-footer">
                        <span className="preview-payment-badge">{paymentMethod}</span>
                        {paymentMethod === 'cash' && changeToReturn > 0 && (
                            <div className="preview-change">Change: ₹{changeToReturn}</div>
                        )}
                        <div className="preview-watermark">Christalin Mirrors — {selectedBranch}</div>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {showPayModal && (
                <div className="billing-modal-overlay">
                    <div className="billing-modal">
                        <h2>Confirm Payment</h2>
                        <div className="modal-total">₹{total.toLocaleString()}</div>
                        <div className="modal-summary">
                            <div>Client: <strong>{selectedClient === 'walk-in' ? 'Walk-in Guest' : selectedClient ? selectedClient.name : 'None'}</strong></div>
                            <div>Items: <strong>{items.length}</strong></div>
                            <div>Method: <strong style={{ textTransform: 'uppercase' }}>{paymentMethod}</strong></div>
                        </div>

                        {paymentMethod === 'cash' && (
                            <div className="modal-cash-input">
                                <label>Amount Received</label>
                                <input className="admin-form-input large-input text-center" type="number" value={amountReceived} onChange={e => setAmountReceived(parseInt(e.target.value) || 0)} autoFocus />
                                {changeToReturn > 0 && <div className="modal-change">Return Change: ₹{changeToReturn}</div>}
                            </div>
                        )}

                        <div className="modal-actions">
                            <button className="admin-btn admin-btn-secondary" onClick={() => setShowPayModal(false)}>← Back to Bill</button>
                            <button className="admin-btn admin-btn-success" onClick={confirmPayment}>✓ Confirm Payment</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
