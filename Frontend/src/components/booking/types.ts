export interface BookingData {
    name: string
    email: string
    phone: string
    branchId: string
    serviceNames: string[]
    date: string
    time: string
    notes: string
}

export const emptyBookingData: BookingData = {
    name: '',
    email: '',
    phone: '',
    branchId: '',
    serviceNames: [],
    date: '',
    time: '',
    notes: '',
}

export const STEP_LABELS = ['About You', 'Studio', 'Services', 'Date & Time', 'Confirm'] as const

export interface StepProps {
    data: BookingData
    update: (patch: Partial<BookingData>) => void
}
