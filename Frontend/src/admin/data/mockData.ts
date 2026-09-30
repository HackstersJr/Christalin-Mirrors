import type { Appointment, Client, ServiceRecord, StaffMember, SalonSettings, ServiceVisit, Invoice, InventoryItem } from './types'

// ═══════════════════════════════════════════════════════════════
//  Mock Data — Seed data for localStorage
// ═══════════════════════════════════════════════════════════════

export const mockAppointments: Appointment[] = []

export const mockClients: Client[] = []

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
    { id: 'staff_sushmitha', name: 'Sushmitha Cristalin A.', role: 'owner', branch: 'All Branches', phone: '+91 72042 36981', email: 'christalinmirrors.admin@gmail.com', specialties: ['Salon Management', 'Brand Strategy'], isActive: true, joinedDate: '2025-01-01' },
]

export const defaultSettings: SalonSettings = {
    name: 'Christalin Mirrors',
    email: 'christalinmirrors.admin@gmail.com',
    phone: '+91 72042 36981',
    hours: 'Everyday: 10:00 AM – 9:00 PM',
    branches: [
        {
            id: 'branch_blr',
            name: 'CM — Bengaluru',
            city: 'Bengaluru, Karnataka',
            address: 'Century Ethos Club House, Bellary Rd, Bengaluru 560092',
            phone: '+91 7204236981',
            isActive: true,
            status: 'operational',
            manager: 'Branch Manager (Bengaluru)',
            ownershipNote: 'CEO (Sole Owner — 100%)',
        },
        {
            id: 'branch_klb',
            name: 'CM — Kalaburagi (Gulbarga)',
            city: 'Kalaburagi, Karnataka',
            address: 'Orchid Mall, Mahaveer Nagar, Khuba Plot, Brahmpur, Kalaburagi 585105',
            phone: '+91 918715909',
            isActive: true,
            status: 'operational',
            manager: 'Branch Manager (Kalaburagi)',
            ownershipNote: 'Partners (64%) · CEO (36%)',
        },
        {
            id: 'branch_bgm',
            name: 'CM — Belgaum (Belagavi)',
            city: 'Belgaum, Karnataka',
            address: 'College Road, Belgaum 590001',
            phone: '+91 8050153999',
            isActive: true,
            status: 'operational',
            manager: 'Branch Manager (Belgaum)',
            ownershipNote: 'Partner (30%) · CEO (70%)',
        },
        {
            id: 'branch_manea',
            name: 'CM — Manea',
            city: 'Kalaburagi, Karnataka',
            address: 'Kalaburagi, Karnataka 585105',
            phone: '',
            isActive: true,
            status: 'operational',
            isUnderCeo: true,
            manager: 'Direct Executive Operations (CEO)',
            ownershipNote: 'CEO (Sole Owner — 100% Under CEO)',
        },
        {
            id: 'branch_upc_1',
            name: 'CM — Upcoming Branch 1 (Yelahanka)',
            city: 'Yelahanka Phase 1, Bengaluru',
            address: 'Major Arterial Rd, Yelahanka New Town, Bengaluru 560064',
            phone: '+91 99001 18385',
            isActive: true,
            status: 'upcoming',
            targetLaunch: 'November 2026',
            manager: 'Pre-Opening Project Team',
            ownershipNote: 'CEO (Sole Owner — 100% Pre-Launch)',
        },
        {
            id: 'branch_upc_2',
            name: 'CM — Upcoming Branch 2 (Hassan)',
            city: 'Hassan, Karnataka',
            address: 'BM Road, Hassan 573201',
            phone: '+91 99001 18386',
            isActive: true,
            status: 'upcoming',
            targetLaunch: 'January 2027',
            manager: 'Pre-Opening Project Team',
            ownershipNote: 'CEO (Sole Owner — 100% Pre-Launch)',
        },
    ],
    socialLinks: { instagram: 'https://instagram.com' },
}

export const mockVisits: ServiceVisit[] = []
export const mockInvoices: Invoice[] = []

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
