import type { Appointment, Client, ServiceRecord, StaffMember, SalonSettings, ServiceVisit, Invoice, InventoryItem } from './types'

// ═══════════════════════════════════════════════════════════════
//  Mock Data — Seed data for localStorage
// ═══════════════════════════════════════════════════════════════

export const mockAppointments: Appointment[] = [
    { id: 'apt-001', clientId: '', staffId: '', serviceId: '', clientName: 'Meera Reddy', clientEmail: 'meera@email.com', clientPhone: '+91 98765 43210', date: '2026-03-17', time: '10:00 AM', service: 'Balayage', stylist: 'Ananya', status: 'confirmed', branch: 'Bengaluru', createdAt: '2026-03-15T10:00:00Z' },
    { id: 'apt-002', clientId: '', staffId: '', serviceId: '', clientName: 'Ravi Kumar', clientEmail: 'ravi@email.com', date: '2026-03-17', time: '11:00 AM', service: 'Classic & Creative Cuts', stylist: 'Vikram', status: 'confirmed', branch: 'Bengaluru', createdAt: '2026-03-15T11:00:00Z' },
    { id: 'apt-003', clientId: '', staffId: '', serviceId: '', clientName: 'Priya Sharma', clientEmail: 'priya@email.com', clientPhone: '+91 87654 32109', date: '2026-03-17', time: '2:00 PM', service: 'Korean Glass Skin Facial', stylist: 'Ananya', status: 'pending', branch: 'Bengaluru', createdAt: '2026-03-16T09:00:00Z' },
    { id: 'apt-004', clientId: '', staffId: '', serviceId: '', clientName: 'Arjun Desai', clientEmail: 'arjun@email.com', date: '2026-03-17', time: '3:00 PM', service: 'Beard Grooming', status: 'pending', branch: 'Kalaburagi', createdAt: '2026-03-16T12:00:00Z' },
    { id: 'apt-005', clientId: '', staffId: '', serviceId: '', clientName: 'Sneha Patil', clientEmail: 'sneha@email.com', date: '2026-03-18', time: '10:00 AM', service: 'Luxury Bridal Makeover', stylist: 'Ananya', status: 'confirmed', branch: 'Bengaluru', notes: 'Wedding on March 20', createdAt: '2026-03-14T16:00:00Z' },
    { id: 'apt-006', clientId: '', staffId: '', serviceId: '', clientName: 'Karthik Nair', clientEmail: 'karthik@email.com', date: '2026-03-18', time: '12:00 PM', service: 'Keratin & Smoothing', stylist: 'Vikram', status: 'pending', branch: 'Bengaluru', createdAt: '2026-03-16T14:00:00Z' },
    { id: 'apt-007', clientId: '', staffId: '', serviceId: '', clientName: 'Anita Joshi', clientEmail: 'anita@email.com', date: '2026-03-16', time: '11:00 AM', service: 'Glass Skin Facials', stylist: 'Ananya', status: 'completed', branch: 'Kalaburagi', createdAt: '2026-03-14T09:00:00Z' },
    { id: 'apt-008', clientId: '', staffId: '', serviceId: '', clientName: 'Deepak Verma', clientEmail: 'deepak@email.com', date: '2026-03-16', time: '4:00 PM', service: 'Hair Color Studio', status: 'cancelled', notes: 'Client rescheduled', branch: 'Bengaluru', createdAt: '2026-03-13T11:00:00Z' },
]

export const mockClients: Client[] = [
    { id: 'cli-001', name: 'Meera Reddy', email: 'meera@email.com', phone: '+91 98765 43210', gender: 'female', branch: 'Bengaluru', joinedDate: '2025-06-15', totalVisits: 12, lastVisit: '2026-03-10', preferredStylist: 'Ananya', notes: 'Prefers organic products', tags: ['VIP', 'Regular'] },
    { id: 'cli-002', name: 'Ravi Kumar', email: 'ravi@email.com', phone: '+91 87654 32109', gender: 'male', branch: 'Bengaluru', joinedDate: '2025-09-20', totalVisits: 6, lastVisit: '2026-03-05', preferredStylist: 'Vikram', tags: ['Regular'] },
    { id: 'cli-003', name: 'Priya Sharma', email: 'priya@email.com', phone: '+91 76543 21098', gender: 'female', branch: 'Bengaluru', joinedDate: '2025-11-01', totalVisits: 4, lastVisit: '2026-02-28', tags: ['New'] },
    { id: 'cli-004', name: 'Arjun Desai', email: 'arjun@email.com', phone: '+91 65432 10987', gender: 'male', branch: 'Kalaburagi', joinedDate: '2026-01-10', totalVisits: 2, lastVisit: '2026-03-01', tags: ['New'] },
    { id: 'cli-005', name: 'Sneha Patil', email: 'sneha@email.com', phone: '+91 54321 09876', gender: 'female', branch: 'Bengaluru', joinedDate: '2025-04-05', totalVisits: 18, lastVisit: '2026-03-14', preferredStylist: 'Ananya', notes: 'Bridal package client', tags: ['VIP', 'Bridal'] },
    { id: 'cli-006', name: 'Karthik Nair', email: 'karthik@email.com', phone: '+91 43210 98765', gender: 'male', branch: 'Bengaluru', joinedDate: '2025-12-01', totalVisits: 3, lastVisit: '2026-02-20', tags: [] },
]

export const mockServices: ServiceRecord[] = [
    { id: 'svc-001', name: 'Precision Haircut', category: 'hair', duration: 45, price: 500, isActive: true, description: 'U/V layer cut, advance creative cuts & kids styling' },
    { id: 'svc-002', name: 'Wash & Styling', category: 'hair', duration: 30, price: 300, isActive: true, description: 'Wash, blast dry, conditioning & ironing' },
    { id: 'svc-003', name: 'Hair Color Studio', category: 'hair', duration: 120, price: 3000, isActive: true, description: 'Root touch up, global color, fashion shades & highlights' },
    { id: 'svc-004', name: 'Balayage', category: 'hair', duration: 180, price: 5000, isActive: true, description: 'Hand-painted natural gradients with premium colors' },
    { id: 'svc-005', name: 'Keratin & Smoothing', category: 'hair', duration: 150, price: 4000, isActive: true, description: 'Frizz-free finish with keratin, botox & nano plastia' },
    { id: 'svc-006', name: 'Korean Glass Skin Facial', category: 'korean', duration: 90, price: 3500, isActive: true, isKorean: true, description: 'Where Korean skin science meets restorative hydration' },
    { id: 'svc-007', name: 'Ultimate K-Glow Ritual', category: 'korean', duration: 120, price: 5000, isActive: true, isKorean: true, description: 'The pinnacle of Korean scalp and hair therapy' },
    { id: 'svc-008', name: 'Luxury Bridal Makeover', category: 'womens', duration: 180, price: 15000, isActive: true, description: 'MAC, Laura Mercier, Huda Beauty & Fenty options' },
    { id: 'svc-009', name: 'Classic & Creative Cuts', category: 'mens', duration: 30, price: 400, isActive: true, description: 'Wash & blast dry, head shave, and creative haircuts' },
    { id: 'svc-010', name: 'Beard Grooming', category: 'mens', duration: 20, price: 250, isActive: true, description: 'Beard trim, shave, beard colour & moustache colour' },
    { id: 'svc-011', name: 'Glass Skin Facials', category: 'skin', duration: 60, price: 2500, isActive: true, isKorean: true, description: 'Hydra aloe, K elite glow & Korean glass skin hydra facial' },
    { id: 'svc-012', name: 'Wellness Massage', category: 'skin', duration: 60, price: 1500, isActive: true, description: 'Body massage, foot/back/hand, body scrub & body polish' },
]

export const mockStaff: StaffMember[] = [
    { id: 'stf-001', name: 'Ananya Rao', role: 'stylist', branch: 'Bengaluru', phone: '+91 99887 76655', email: 'ananya@cm.com', specialties: ['Balayage', 'Korean Facials', 'Bridal Makeup'], isActive: true, joinedDate: '2025-03-01' },
    { id: 'stf-002', name: 'Vikram Singh', role: 'stylist', branch: 'Bengaluru', phone: '+91 88776 65544', email: 'vikram@cm.com', specialties: ['Men\'s Cuts', 'Hair Color', 'Keratin'], isActive: true, joinedDate: '2025-05-15' },
    { id: 'stf-003', name: 'Divya Menon', role: 'therapist', branch: 'Kalaburagi', phone: '+91 77665 54433', email: 'divya@cm.com', specialties: ['Korean Head Spa', 'Facials', 'Massage'], isActive: true, joinedDate: '2025-11-01' },
    { id: 'stf-004', name: 'Preethi S.', role: 'receptionist', branch: 'Bengaluru', phone: '+91 66554 43322', email: 'preethi@cm.com', specialties: [], isActive: true, joinedDate: '2025-04-01' },
    { id: 'stf-005', name: 'Sushmitha Cristalin A.', role: 'manager', branch: 'Bengaluru', phone: '+91 72042 36981', email: 'info@christalinmirrors.com', specialties: ['Salon Management', 'Brand Strategy'], isActive: true, joinedDate: '2025-01-01' },
]

export const defaultSettings: SalonSettings = {
    name: 'Christalin Mirrors',
    email: 'info@christalinmirrors.com',
    phone: '+91 72042 36981',
    hours: 'Everyday: 10:00 AM – 9:00 PM',
    branches: [
        { name: 'CM — Bengaluru', city: 'Bengaluru, Karnataka', address: 'Century Ethos Club House, Bellary Rd, Bengaluru 560092', phone: '+91 72042 36981', isActive: true },
        { name: 'CM — Kalaburagi', city: 'Kalaburagi, Karnataka', address: 'Orchid Mall, Mahaveer Nagar, Khuba Plot, Brahmpur, Kalaburagi 585105', phone: '+91 XXXXX XXXXX', isActive: true },
    ],
    socialLinks: { instagram: 'https://instagram.com' },
}

// ─── Service Visit History ──────────────────────────────────
export const mockVisits: ServiceVisit[] = [
    { id: 'vis-001', clientId: 'cli-001', clientName: 'Meera Reddy', date: '2026-03-10', services: [{ name: 'Balayage', price: 5000 }, { name: 'Wash & Styling', price: 300 }], stylist: 'Ananya', branch: 'Bengaluru', subtotal: 5300, discount: 530, tax: 858, total: 5628, paymentMethod: 'upi', rating: 5, invoiceId: 'inv-001' },
    { id: 'vis-002', clientId: 'cli-001', clientName: 'Meera Reddy', date: '2026-02-22', services: [{ name: 'Korean Glass Skin Facial', price: 3500 }], stylist: 'Ananya', branch: 'Bengaluru', subtotal: 3500, discount: 0, tax: 630, total: 4130, paymentMethod: 'card', rating: 5, invoiceId: 'inv-002' },
    { id: 'vis-003', clientId: 'cli-002', clientName: 'Ravi Kumar', date: '2026-03-05', services: [{ name: 'Classic & Creative Cuts', price: 400 }, { name: 'Beard Grooming', price: 250 }], stylist: 'Vikram', branch: 'Bengaluru', subtotal: 650, discount: 0, tax: 117, total: 767, paymentMethod: 'cash', rating: 4, invoiceId: 'inv-003' },
    { id: 'vis-004', clientId: 'cli-005', clientName: 'Sneha Patil', date: '2026-03-14', services: [{ name: 'Precision Haircut', price: 500 }, { name: 'Glass Skin Facials', price: 2500 }], stylist: 'Ananya', branch: 'Bengaluru', subtotal: 3000, discount: 300, tax: 486, total: 3186, paymentMethod: 'card', rating: 5, invoiceId: 'inv-004' },
    { id: 'vis-005', clientId: 'cli-005', clientName: 'Sneha Patil', date: '2026-02-28', services: [{ name: 'Luxury Bridal Makeover', price: 15000 }], stylist: 'Ananya', branch: 'Bengaluru', subtotal: 15000, discount: 1500, tax: 2430, total: 15930, paymentMethod: 'card', notes: 'Trial bridal makeup session', invoiceId: 'inv-005' },
    { id: 'vis-006', clientId: 'cli-003', clientName: 'Priya Sharma', date: '2026-02-28', services: [{ name: 'Keratin & Smoothing', price: 4000 }], stylist: 'Ananya', branch: 'Bengaluru', subtotal: 4000, discount: 0, tax: 720, total: 4720, paymentMethod: 'upi', rating: 4, invoiceId: 'inv-006' },
    { id: 'vis-007', clientId: 'cli-004', clientName: 'Arjun Desai', date: '2026-03-01', services: [{ name: 'Classic & Creative Cuts', price: 400 }], stylist: 'Divya', branch: 'Kalaburagi', subtotal: 400, discount: 0, tax: 72, total: 472, paymentMethod: 'cash', invoiceId: 'inv-007' },
    { id: 'vis-008', clientId: 'cli-006', clientName: 'Karthik Nair', date: '2026-02-20', services: [{ name: 'Hair Color Studio', price: 3000 }, { name: 'Wash & Styling', price: 300 }], stylist: 'Vikram', branch: 'Bengaluru', subtotal: 3300, discount: 0, tax: 594, total: 3894, paymentMethod: 'card', invoiceId: 'inv-008' },
]

// ─── Invoices ───────────────────────────────────────────────
export const mockInvoices: Invoice[] = [
    { id: 'inv-001', invoiceNumber: 'CM-INV-0001', clientId: 'cli-001', clientName: 'Meera Reddy', clientEmail: 'meera@email.com', clientPhone: '+91 98765 43210', date: '2026-03-10', items: [{ service: 'Balayage', quantity: 1, unitPrice: 5000, total: 5000 }, { service: 'Wash & Styling', quantity: 1, unitPrice: 300, total: 300 }], subtotal: 5300, discountPercent: 10, discountAmount: 530, taxPercent: 18, taxAmount: 858, total: 5628, amountPaid: 5628, status: 'paid', paymentMethod: 'upi', branch: 'Bengaluru', stylist: 'Ananya', createdAt: '2026-03-10T12:00:00Z' },
    { id: 'inv-002', invoiceNumber: 'CM-INV-0002', clientId: 'cli-001', clientName: 'Meera Reddy', clientEmail: 'meera@email.com', date: '2026-02-22', items: [{ service: 'Korean Glass Skin Facial', quantity: 1, unitPrice: 3500, total: 3500 }], subtotal: 3500, discountPercent: 0, discountAmount: 0, taxPercent: 18, taxAmount: 630, total: 4130, amountPaid: 4130, status: 'paid', paymentMethod: 'card', branch: 'Bengaluru', stylist: 'Ananya', createdAt: '2026-02-22T14:00:00Z' },
    { id: 'inv-003', invoiceNumber: 'CM-INV-0003', clientId: 'cli-002', clientName: 'Ravi Kumar', clientEmail: 'ravi@email.com', date: '2026-03-05', items: [{ service: 'Classic & Creative Cuts', quantity: 1, unitPrice: 400, total: 400 }, { service: 'Beard Grooming', quantity: 1, unitPrice: 250, total: 250 }], subtotal: 650, discountPercent: 0, discountAmount: 0, taxPercent: 18, taxAmount: 117, total: 767, amountPaid: 767, status: 'paid', paymentMethod: 'cash', branch: 'Bengaluru', stylist: 'Vikram', createdAt: '2026-03-05T12:00:00Z' },
    { id: 'inv-004', invoiceNumber: 'CM-INV-0004', clientId: 'cli-005', clientName: 'Sneha Patil', clientEmail: 'sneha@email.com', date: '2026-03-14', items: [{ service: 'Precision Haircut', quantity: 1, unitPrice: 500, total: 500 }, { service: 'Glass Skin Facials', quantity: 1, unitPrice: 2500, total: 2500 }], subtotal: 3000, discountPercent: 10, discountAmount: 300, taxPercent: 18, taxAmount: 486, total: 3186, amountPaid: 3186, status: 'paid', paymentMethod: 'card', branch: 'Bengaluru', stylist: 'Ananya', createdAt: '2026-03-14T16:00:00Z' },
    { id: 'inv-005', invoiceNumber: 'CM-INV-0005', clientId: 'cli-005', clientName: 'Sneha Patil', clientEmail: 'sneha@email.com', date: '2026-02-28', items: [{ service: 'Luxury Bridal Makeover', quantity: 1, unitPrice: 15000, total: 15000 }], subtotal: 15000, discountPercent: 10, discountAmount: 1500, taxPercent: 18, taxAmount: 2430, total: 15930, amountPaid: 15930, status: 'paid', paymentMethod: 'card', branch: 'Bengaluru', stylist: 'Ananya', notes: 'Trial session — Balance for wedding day', createdAt: '2026-02-28T18:00:00Z' },
    { id: 'inv-006', invoiceNumber: 'CM-INV-0006', clientId: 'cli-003', clientName: 'Priya Sharma', clientEmail: 'priya@email.com', date: '2026-02-28', items: [{ service: 'Keratin & Smoothing', quantity: 1, unitPrice: 4000, total: 4000 }], subtotal: 4000, discountPercent: 0, discountAmount: 0, taxPercent: 18, taxAmount: 720, total: 4720, amountPaid: 4720, status: 'paid', paymentMethod: 'upi', branch: 'Bengaluru', createdAt: '2026-02-28T15:00:00Z' },
    { id: 'inv-007', invoiceNumber: 'CM-INV-0007', clientId: 'cli-004', clientName: 'Arjun Desai', clientEmail: 'arjun@email.com', date: '2026-03-01', items: [{ service: 'Classic & Creative Cuts', quantity: 1, unitPrice: 400, total: 400 }], subtotal: 400, discountPercent: 0, discountAmount: 0, taxPercent: 18, taxAmount: 72, total: 472, amountPaid: 472, status: 'paid', paymentMethod: 'cash', branch: 'Kalaburagi', createdAt: '2026-03-01T13:00:00Z' },
    { id: 'inv-008', invoiceNumber: 'CM-INV-0008', clientId: 'cli-006', clientName: 'Karthik Nair', clientEmail: 'karthik@email.com', date: '2026-02-20', items: [{ service: 'Hair Color Studio', quantity: 1, unitPrice: 3000, total: 3000 }, { service: 'Wash & Styling', quantity: 1, unitPrice: 300, total: 300 }], subtotal: 3300, discountPercent: 0, discountAmount: 0, taxPercent: 18, taxAmount: 594, total: 3894, amountPaid: 3894, status: 'paid', paymentMethod: 'card', branch: 'Bengaluru', stylist: 'Vikram', createdAt: '2026-02-20T14:00:00Z' },
]

// ─── Inventory ──────────────────────────────────────────────
export const mockInventory: InventoryItem[] = [
    { id: 'itm-001', name: 'Olaplex No.3', brand: 'Olaplex', category: 'hair-care', sku: 'OPX-003', currentStock: 8, minStock: 3, costPrice: 2200, retailPrice: 3500, branch: 'Bengaluru', lastRestocked: '2026-03-01', isActive: true },
    { id: 'itm-002', name: 'Schwarzkopf IGORA Royal', brand: 'Schwarzkopf', category: 'color', sku: 'SZK-IGR-01', currentStock: 15, minStock: 5, costPrice: 650, retailPrice: 0, branch: 'Bengaluru', lastRestocked: '2026-03-05', isActive: true },
    { id: 'itm-003', name: 'K-Beauty Hydra Serum', brand: 'Cosrx', category: 'skin-care', sku: 'CRX-HYD-01', currentStock: 5, minStock: 3, costPrice: 1800, retailPrice: 2800, branch: 'Bengaluru', lastRestocked: '2026-02-15', isActive: true },
    { id: 'itm-004', name: 'Hair Keratin Treatment Kit', brand: 'GK Hair', category: 'hair-care', sku: 'GKH-KTK-01', currentStock: 3, minStock: 2, costPrice: 4500, retailPrice: 0, branch: 'Bengaluru', lastRestocked: '2026-02-20', isActive: true },
    { id: 'itm-005', name: 'MAC Pro Longwear Foundation', brand: 'MAC', category: 'skin-care', sku: 'MAC-PLF-01', currentStock: 6, minStock: 2, costPrice: 2800, retailPrice: 3600, branch: 'Bengaluru', lastRestocked: '2026-03-10', isActive: true },
    { id: 'itm-006', name: 'Disposable Capes (50 pack)', brand: 'Generic', category: 'consumables', sku: 'GEN-CAP-50', currentStock: 2, minStock: 5, costPrice: 450, retailPrice: 0, branch: 'Bengaluru', lastRestocked: '2026-01-15', isActive: true },
    { id: 'itm-007', name: 'Professional Hair Scissors', brand: 'Jaguar', category: 'tools', sku: 'JAG-SCR-01', currentStock: 4, minStock: 2, costPrice: 8500, retailPrice: 0, branch: 'Bengaluru', lastRestocked: '2025-11-01', isActive: true },
    { id: 'itm-008', name: 'K-Beauty Clay Mask', brand: 'Innisfree', category: 'skin-care', sku: 'INF-CLM-01', currentStock: 1, minStock: 3, costPrice: 900, retailPrice: 1500, branch: 'Kalaburagi', lastRestocked: '2026-01-20', isActive: true },
]
