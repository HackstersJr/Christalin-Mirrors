export interface CapitalInvestment {
    id: string
    branch: string             // e.g. 'Upcoming Branch 1 (Yelahanka)' or 'Upcoming Branch 2 (Hassan)'
    date: string               // 'YYYY-MM-DD'
    contributor: 'CEO' | 'Partner' | 'Joint'
    contributorName: string    // e.g. 'CEO (Lead)', 'Partner (50% Co-Investor)'
    amount: number             // in INR
    paymentMode: 'Bank Transfer' | 'Direct Vendor Pay' | 'Cheque' | 'Cash'
    category: 'civil_fitout' | 'furniture_styling_chairs' | 'electrical_lighting' | 'plumbing_washunits' | 'hvac_ac' | 'lease_advance' | 'licenses_permits' | 'signage_branding' | 'other'
    itemDescription: string    // e.g. 'Advance for Hydraulic Styling Chairs and Shampoo Wash Basins'
    vendorName?: string        // e.g. 'Salon Interiors & Equipments Ltd'
    invoiceRef?: string        // e.g. 'INV-2026-088'
    notes?: string
    recordedBy: string         // 'CEO / Solo Admin'
    createdAt: string
}

const STORAGE_KEY = 'cm_capital_investments_v1'

const DEFAULT_INVESTMENTS: CapitalInvestment[] = [
    {
        id: 'cap-upc1-01',
        branch: 'Upcoming Branch 1 (Yelahanka)',
        date: '2026-09-02',
        contributor: 'CEO',
        contributorName: 'CEO (Meghnath / Director)',
        amount: 250000,
        paymentMode: 'Bank Transfer',
        category: 'lease_advance',
        itemDescription: 'Premises Security Lease Deposit (5 Months Advance)',
        vendorName: 'Yelahanka Commercial Complex Landlord',
        invoiceRef: 'LEASE-AGR-YEL-01',
        notes: 'Non-recurring capital outlay. Dedicated premises leased for 5 years.',
        recordedBy: 'CEO / Solo Admin',
        createdAt: '2026-09-02T10:00:00.000Z'
    },
    {
        id: 'cap-upc1-02',
        branch: 'Upcoming Branch 1 (Yelahanka)',
        date: '2026-09-08',
        contributor: 'Partner',
        contributorName: 'Partner (Expansion Co-Investor)',
        amount: 120000,
        paymentMode: 'Direct Vendor Pay',
        category: 'furniture_styling_chairs',
        itemDescription: '6x Premium Hydraulic Styling Chairs & 2x Shampoo Wash Units (Advance 50%)',
        vendorName: 'Glitz Salon Furnishings',
        invoiceRef: 'GSF-9821',
        notes: 'Procured directly by Partner equity infusion.',
        recordedBy: 'CEO / Solo Admin',
        createdAt: '2026-09-08T14:30:00.000Z'
    },
    {
        id: 'cap-upc1-03',
        branch: 'Upcoming Branch 1 (Yelahanka)',
        date: '2026-09-12',
        contributor: 'CEO',
        contributorName: 'CEO (Meghnath / Director)',
        amount: 85000,
        paymentMode: 'Bank Transfer',
        category: 'civil_fitout',
        itemDescription: 'Styling Mirrors, Console Joinery & Reception Desk Carpentry Work',
        vendorName: 'Apex Woodcraft Joinery',
        invoiceRef: 'AWJ-441',
        notes: 'Civil and bespoke woodwork milestone payment 1.',
        recordedBy: 'CEO / Solo Admin',
        createdAt: '2026-09-12T16:00:00.000Z'
    },
    {
        id: 'cap-upc1-04',
        branch: 'Upcoming Branch 1 (Yelahanka)',
        date: '2026-09-16',
        contributor: 'Partner',
        contributorName: 'Partner (Expansion Co-Investor)',
        amount: 70000,
        paymentMode: 'Bank Transfer',
        category: 'electrical_lighting',
        itemDescription: 'Electrical Fitout, Architectural Warm Track Lights & Distribution Board',
        vendorName: 'Karnataka Electricals & Illuminations',
        invoiceRef: 'KEI-019',
        notes: 'Track lighting and emergency power cabling.',
        recordedBy: 'CEO / Solo Admin',
        createdAt: '2026-09-16T11:20:00.000Z'
    },
    {
        id: 'cap-upc2-01',
        branch: 'Upcoming Branch 2 (Hassan)',
        date: '2026-09-05',
        contributor: 'CEO',
        contributorName: 'CEO (Meghnath / Director)',
        amount: 180000,
        paymentMode: 'Bank Transfer',
        category: 'lease_advance',
        itemDescription: 'Premises Security Deposit (Hassan Prime High Street)',
        vendorName: 'Hassan Property Owners Assoc.',
        invoiceRef: 'HSSN-LSE-2026',
        notes: 'Commercial lease advance for 2,400 sq.ft salon space.',
        recordedBy: 'CEO / Solo Admin',
        createdAt: '2026-09-05T09:15:00.000Z'
    },
    {
        id: 'cap-upc2-02',
        branch: 'Upcoming Branch 2 (Hassan)',
        date: '2026-09-10',
        contributor: 'Partner',
        contributorName: 'Partner (Expansion Co-Investor)',
        amount: 95000,
        paymentMode: 'Direct Vendor Pay',
        category: 'plumbing_washunits',
        itemDescription: 'Salon Commercial Plumbing Lines, Booster Pump & Wash Basin Infrastructure',
        vendorName: 'Hassan Plumbing Engineering',
        invoiceRef: 'HPE-501',
        notes: 'Plumbing contractor advance milestone.',
        recordedBy: 'CEO / Solo Admin',
        createdAt: '2026-09-10T13:40:00.000Z'
    },
    {
        id: 'cap-upc2-03',
        branch: 'Upcoming Branch 2 (Hassan)',
        date: '2026-09-18',
        contributor: 'CEO',
        contributorName: 'CEO (Meghnath / Director)',
        amount: 70000,
        paymentMode: 'Bank Transfer',
        category: 'hvac_ac',
        itemDescription: 'Commercial Inverter Cassette Air Conditioners (Advance booking)',
        vendorName: 'Daikin Commercial Climate',
        invoiceRef: 'DKN-AC-892',
        notes: '2x 3.0 Ton Cassette units ordered.',
        recordedBy: 'CEO / Solo Admin',
        createdAt: '2026-09-18T17:00:00.000Z'
    }
]

export const capitalInvestmentStore = {
    getAll(): CapitalInvestment[] {
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            if (!raw) {
                this.saveAll(DEFAULT_INVESTMENTS)
                return DEFAULT_INVESTMENTS
            }
            return JSON.parse(raw)
        } catch (e) {
            console.error('Failed to load capital investments', e)
            return DEFAULT_INVESTMENTS
        }
    },

    saveAll(records: CapitalInvestment[]) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
        } catch (e) {
            console.error('Failed to save capital investments', e)
        }
    },

    getByBranch(branch: string): CapitalInvestment[] {
        const all = this.getAll()
        if (branch === 'all' || branch === 'consolidated') return all
        return all.filter(r => r.branch === branch)
    },

    addRecord(record: Omit<CapitalInvestment, 'id' | 'createdAt'>): CapitalInvestment {
        const all = this.getAll()
        const newRecord: CapitalInvestment = {
            ...record,
            id: `cap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            createdAt: new Date().toISOString()
        }
        all.unshift(newRecord)
        this.saveAll(all)
        return newRecord
    },

    updateRecord(id: string, updates: Partial<CapitalInvestment>): boolean {
        const all = this.getAll()
        const idx = all.findIndex(r => r.id === id)
        if (idx === -1) return false
        all[idx] = { ...all[idx], ...updates }
        this.saveAll(all)
        return true
    },

    deleteRecord(id: string): boolean {
        const all = this.getAll()
        const filtered = all.filter(r => r.id !== id)
        if (filtered.length === all.length) return false
        this.saveAll(filtered)
        return true
    },

    getTotals(branch: string = 'all') {
        const list = this.getByBranch(branch)
        let total = 0
        let ceoTotal = 0
        let partnerTotal = 0
        let jointTotal = 0

        for (const item of list) {
            total += item.amount || 0
            if (item.contributor === 'CEO') {
                ceoTotal += item.amount || 0
            } else if (item.contributor === 'Partner') {
                partnerTotal += item.amount || 0
            } else {
                jointTotal += item.amount || 0
                ceoTotal += (item.amount || 0) / 2
                partnerTotal += (item.amount || 0) / 2
            }
        }

        return {
            total,
            ceoTotal,
            partnerTotal,
            jointTotal,
            count: list.length
        }
    }
}
