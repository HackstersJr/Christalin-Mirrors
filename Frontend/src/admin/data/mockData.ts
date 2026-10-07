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
    // Owner
    { id: 'staff_sushmitha', name: 'Sushmitha Cristalin A.', role: 'owner', branch: 'All Branches', phone: '+91 72042 36981', email: 'christalinmirrors.admin@gmail.com', specialties: ['Salon Management', 'Brand Strategy'], isActive: true, joinedDate: '2025-01-01' },

    // Bengaluru Branch Team
    { id: '9c0d19a9-39e2-4cbb-b81c-997d030c81de', name: 'Meghnath S', role: 'manager', branch: 'Bengaluru', phone: '9620992377', email: 'meghnath.s.official@gmail.com', specialties: ['Salon Management', 'Data Analyst'], isActive: true, joinedDate: '2026-09-11' },
    { id: '5f734bdb-fece-4be4-9ed7-12b7437105cd', name: 'Aparna', role: 'hairstylist', branch: 'Bengaluru', phone: '6362530826', email: 'aparna.bengaluru@christalinmirrors.com', specialties: ['Hair Styling', 'Creative Cuts'], isActive: true, joinedDate: '2026-09-11' },
    { id: '9334db0f-53c6-449a-ad24-07389dc0be24', name: 'Rihana', role: 'hairstylist', branch: 'Bengaluru', phone: '8604304131', email: 'rihana.bengaluru@christalinmirrors.com', specialties: ['Haircuts', 'Styling'], isActive: true, joinedDate: '2026-09-11' },
    { id: '67682ff8-9251-41c6-aa94-a44fb9cec807', name: 'Akram', role: 'hairstylist', branch: 'Bengaluru', phone: '8604304131', email: 'akram.bengaluru@christalinmirrors.com', specialties: ['Men Cuts', 'Beard Styling'], isActive: true, joinedDate: '2026-09-11' },

    // Kalaburagi Branch Team
    { id: '44a4c730-42bc-4bbb-a9fe-eed3b7c3e936', name: 'Soniya', role: 'manager', branch: 'Kalaburagi', phone: '7411172933', email: 'manager.kalaburagi@christalinmirrors.com', specialties: ['Salon Management', 'Client Relations'], isActive: true, joinedDate: '2026-07-30' },
    { id: '8282442b-c487-4382-b585-642c8f54cb23', name: 'Neha', role: 'unisex_beautician', branch: 'Kalaburagi', phone: '63661 35925', email: 'neha.kalaburagi@christalinmirrors.com', specialties: ['Skin Care', 'Facials'], isActive: true, joinedDate: '2026-09-11' },
    { id: 'd89345a6-fc42-4e59-8441-626167473be7', name: 'Ronak', role: 'beautician', branch: 'Kalaburagi', phone: '8053455405', email: 'ronak.kalaburagi@christalinmirrors.com', specialties: ['Skin Care', 'Facials', 'Beauty'], isActive: true, joinedDate: '2026-07-30' },
    { id: 'c0111109-c999-4ba8-bd53-57619f9bb724', name: 'Deep', role: 'unisex_hairstylist', branch: 'Kalaburagi', phone: '6283499036', email: 'deep.kalaburagi@christalinmirrors.com', specialties: ['Haircuts', 'Styling', 'Unisex Services'], isActive: true, joinedDate: '2026-07-30' },
    { id: 'a4959067-e7ca-47d6-a1bf-a6064a919896', name: 'Faizan', role: 'hairstylist', branch: 'Kalaburagi', phone: '7037500352', email: 'faizan.kalaburagi@christalinmirrors.com', specialties: ['Hair Styling', 'Cuts'], isActive: true, joinedDate: '2026-07-30' },
    { id: '68b51ae8-108b-4c44-9b93-16620ec4a7a0', name: 'Wasim', role: 'unisex_hairstylist', branch: 'Kalaburagi', phone: '7569889592', email: 'wasim.kalaburagi@christalinmirrors.com', specialties: ['Unisex Haircuts', 'Hair Coloring'], isActive: true, joinedDate: '2026-07-30' },
    { id: 'dbfaa28d-ff92-4b0e-afa4-485115b4154d', name: 'Faheem', role: 'unisex_hairstylist', branch: 'Kalaburagi', phone: '9149840394', email: 'faheem.kalaburagi@christalinmirrors.com', specialties: ['Unisex Haircuts'], isActive: true, joinedDate: '2026-09-11' },
    { id: '755bd009-2bca-4d7a-89b6-f23609d5fd9c', name: 'Reshma', role: 'housekeeping', branch: 'Kalaburagi', phone: '8296512207', email: 'reshma.kalaburagi@christalinmirrors.com', specialties: ['Housekeeping', 'Salon Maintenance'], isActive: true, joinedDate: '2026-07-30' },

    // Belgaum Branch Team
    { id: '6e776543-6526-4d43-8408-20714a430775', name: 'Belgaum Manager', role: 'manager', branch: 'Belgaum', phone: '+91 98450 12345', email: 'manager.belgaum@christalinmirrors.com', specialties: ['Management', 'Client Relations'], isActive: true, joinedDate: '2026-07-30' },
    { id: '23589f93-9f22-4c6d-b678-c8278d28ae2f', name: 'Ankit', role: 'hairstylist', branch: 'Belgaum', phone: '9896089606', email: 'ankit.belgaum@christalinmirrors.com', specialties: ['Haircuts', 'Styling'], isActive: true, joinedDate: '2026-09-11' },
    { id: 'ad43ff0f-31e6-4e23-9482-249a71a2922c', name: 'Saloni', role: 'hairstylist', branch: 'Belgaum', phone: '9896089606', email: 'saloni.belgaum@christalinmirrors.com', specialties: ['Styling', 'Coloring'], isActive: true, joinedDate: '2026-09-11' },
    { id: '789ce2eb-93af-4122-b1b1-804534dcb06e', name: 'Anjana', role: 'beautician', branch: 'Belgaum', phone: '7619344268', email: 'anjana.belgaum@christalinmirrors.com', specialties: ['Skin Care', 'Beauty'], isActive: true, joinedDate: '2026-09-11' },
    { id: 'd1d555bc-0d09-4054-8b52-b5eba0346238', name: 'Danish', role: 'hairstylist', branch: 'Belgaum', phone: '9837348218', email: 'danish.belgaum@christalinmirrors.com', specialties: ['Haircuts', 'Beard Grooming'], isActive: true, joinedDate: '2026-09-11' },
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
            address: '2nd floor, Orchid Mall, Mahaveer Nagar, Khuba Plot, Brhampur, Kalaburagi, Karnataka 585102',
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
            address: 'Ground Floor, Shop No. 2 Jadhav Nagar, Double Rd, Doordarshan Nagar, Belagavi, Karnataka 590019',
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
            address: '',
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
