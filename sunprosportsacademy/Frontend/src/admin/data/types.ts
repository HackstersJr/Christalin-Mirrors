// ═══════════════════════════════════════════════════════════════
//  Admin Data Types — Backend-Ready TypeScript Interfaces
// ═══════════════════════════════════════════════════════════════

export interface Appointment {
    id: string
    clientId: string      // linked client ID (Fix 7 / Task 1)
    staffId: string       // linked staff ID (Task 1)
    serviceId: string     // linked service ID (Task 1)
    clientName: string
    clientEmail: string
    clientPhone?: string
    date: string          // ISO date string YYYY-MM-DD
    time: string          // e.g. "10:00 AM"
    service: string
    stylist?: string
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
    notes?: string
    branch: string
    createdAt: string
}

export interface Client {
    id: string
    name: string
    email: string
    phone: string
    gender: 'female' | 'male' | 'other'
    branch: string
    joinedDate: string
    totalVisits: number
    lastVisit?: string
    preferredStylist?: string
    notes?: string
    tags: string[]
}

export interface ServiceRecord {
    id: string
    name: string
    category: 'hair' | 'skin' | 'korean' | 'womens' | 'mens'
    duration: number      // minutes
    price: number
    isActive: boolean
    isKorean?: boolean
    description: string
}

export interface StaffMember {
    id: string
    name: string
    role: 'stylist' | 'therapist' | 'manager' | 'receptionist'
    branch: string
    phone: string
    email: string
    specialties: string[]
    isActive: boolean
    joinedDate: string
    avatar?: string
}

export interface SalonSettings {
    name: string
    email: string
    phone: string
    hours: string
    branches: {
        name: string
        city: string
        address: string
        phone: string
        isActive: boolean
    }[]
    socialLinks: {
        instagram?: string
        facebook?: string
        website?: string
    }
}

export interface DashboardStats {
    todayAppointments: number
    totalClients: number
    monthRevenue: number
    pendingRequests: number
    completedToday: number
    cancelledToday: number
}

// ─── Service History (Visit Records) ────────────────────────
export interface ServiceVisit {
    id: string
    clientId: string
    clientName: string
    date: string
    services: { name: string; price: number }[]
    stylist: string
    branch: string
    subtotal: number
    discount: number
    tax: number
    total: number
    paymentMethod: 'cash' | 'card' | 'upi' | 'other'
    notes?: string
    rating?: number       // 1-5 client feedback
    invoiceId?: string    // linked invoice
}

// ─── Invoices ───────────────────────────────────────────────
export interface Invoice {
    id: string
    invoiceNumber: string  // e.g. "CM-INV-0001"
    clientId: string
    clientName: string
    clientEmail: string
    clientPhone?: string
    date: string
    dueDate?: string
    items: InvoiceItem[]
    subtotal: number
    discountPercent: number
    discountAmount: number
    taxPercent: number
    taxAmount: number
    total: number
    amountPaid: number
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
    paymentMethod?: 'cash' | 'card' | 'upi' | 'other'
    branch: string
    stylist?: string
    notes?: string
    createdAt: string
    appointmentId?: string  // linked appointment (Fix 2)
}

export interface InvoiceItem {
    service: string
    description?: string
    quantity: number
    unitPrice: number
    total: number
    productId?: string    // linked inventory item ID for stock decrement
}

// ─── Inventory (Products) ───────────────────────────────────
export interface InventoryItem {
    id: string
    name: string
    brand: string
    category: 'hair-care' | 'skin-care' | 'color' | 'tools' | 'consumables'
    sku: string
    currentStock: number
    minStock: number      // reorder alert threshold
    costPrice: number
    retailPrice: number
    branch: string
    lastRestocked?: string
    isActive: boolean
}
