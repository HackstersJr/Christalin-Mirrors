import * as XLSX from 'xlsx'
import type { ManualBranchPL, CapExItem, OpExItem } from './manualProfitLossStore'

export interface ParsedExpenseRow {
    date: string // YYYY-MM-DD
    monthKey: string // YYYY-MM
    branch: string
    type: 'opex' | 'capex'
    category: string
    matchedOpExKey?: keyof ManualBranchPL
    amount: number
    description: string
    rawRow?: any
}

export interface ImportExpenseSummary {
    totalRows: number
    totalOpEx: number
    totalCapEx: number
    months: string[]
    branches: string[]
    byMonthAndBranch: Record<string, Record<string, {
        opexTotal: number
        capexTotal: number
        opexByCategory: Partial<Record<keyof ManualBranchPL, number>>
        capexItems: CapExItem[]
        opexItems: OpExItem[]
    }>>
    invalidRowsCount: number
}

// Keywords mapping to standard OpEx keys
const OPEX_CATEGORY_MAP: { key: keyof ManualBranchPL; keywords: string[] }[] = [
    {
        key: 'salaries_wages',
        keywords: ['salary', 'salaries', 'wage', 'wages', 'payroll', 'stylist pay', 'staff', 'incentive', 'bonus', 'stipend', 'helper'],
    },
    {
        key: 'benefits_insurance',
        keywords: ['insurance', 'benefit', 'health', 'medical', 'esi', 'pf', 'provident', 'welfare'],
    },
    {
        key: 'payroll_tax',
        keywords: ['payroll tax', 'pt', 'professional tax', 'tds on salary'],
    },
    {
        key: 'rent_lease',
        keywords: ['rent', 'lease', 'advance rent', 'salon rent', 'building', 'landlord', 'premises'],
    },
    {
        key: 'utilities',
        keywords: ['utility', 'utilities', 'bescom', 'eb', 'electricity', 'power', 'water', 'internet', 'wifi', 'broadband', 'generator diesel', 'diesel', 'gas', 'waste', 'garbage'],
    },
    {
        key: 'repairs_maintenance',
        keywords: ['repair', 'maintenance', 'amc', 'plumbing', 'electrical', 'carpenter', 'ac service', 'deep cleaning', 'painting', 'upkeep', 'servicing'],
    },
    {
        key: 'general_admin',
        keywords: ['admin', 'general', 'tea', 'coffee', 'pantry', 'stationery', 'software', 'pos', 'subscription', 'bank charges', 'legal', 'accounting', 'auditor', 'office', 'marketing', 'advertising', 'promo', 'sms', 'pr', 'uniform', 'license'],
    },
    {
        key: 'depreciation',
        keywords: ['depreciation', 'amortization', 'depr'],
    },
    {
        key: 'debts_loans',
        keywords: ['debt', 'loan', 'emi', 'interest', 'borrowing', 'financing'],
    },
]

// CapEx keywords
const CAPEX_KEYWORDS = [
    'capex', 'capital', 'equipment', 'asset', 'machine', 'chair', 'styling chair',
    'shampoo station', 'wash basin', 'facial machine', 'hydra', 'dryer', 'blower',
    'straightener', 'steamer', 'renovation', 'interior', 'fitout', 'furniture',
    'mirror', 'ac purchase', 'air conditioner', 'lighting', 'signage', 'board',
    'cctv', 'sound system', 'speaker', 'inverter', 'ups', 'computer', 'laptop',
    'tablet', 'pos machine', 'plumbing installation', 'electrical installation'
]

export function normalizeBranchName(val: any, defaultBranch: string = 'Bengaluru'): string {
    if (!val) return defaultBranch
    const str = String(val).toLowerCase().trim()
    if (str.includes('bengaluru') || str.includes('bangalore') || str === 'blr') return 'Bengaluru'
    if (str.includes('kalaburagi') || str.includes('gulbarga') || str === 'klb') return 'Kalaburagi'
    if (str.includes('belgaum') || str.includes('belagavi') || str === 'bgm') return 'Belgaum'
    return defaultBranch
}

export function parseExcelDate(val: any): { iso: string; monthKey: string } | null {
    if (!val) return null

    // Excel serial number (e.g. 45180)
    if (typeof val === 'number') {
        // Excel 1900 date system
        const utcDays = Math.floor(val - 25569)
        const date = new Date(utcDays * 86400 * 1000)
        if (!isNaN(date.getTime())) {
            const iso = date.toISOString().slice(0, 10)
            return { iso, monthKey: iso.slice(0, 7) }
        }
    }

    const str = String(val).trim()
    if (!str) return null

    // ISO format: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return { iso: str, monthKey: str.slice(0, 7) }
    }

    // Month only: YYYY-MM
    if (/^\d{4}-\d{2}$/.test(str)) {
        return { iso: `${str}-01`, monthKey: str }
    }

    // DD-MM-YYYY or DD/MM/YYYY
    const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/)
    if (dmyMatch) {
        const day = dmyMatch[1].padStart(2, '0')
        const month = dmyMatch[2].padStart(2, '0')
        const year = dmyMatch[3]
        const iso = `${year}-${month}-${day}`
        return { iso, monthKey: `${year}-${month}` }
    }

    // MM-DD-YYYY or MM/DD/YYYY
    const parsed = Date.parse(str)
    if (!isNaN(parsed)) {
        const d = new Date(parsed)
        const iso = d.toISOString().slice(0, 10)
        return { iso, monthKey: iso.slice(0, 7) }
    }

    return null
}

export function classifyExpenseType(
    rawType: string = '',
    category: string = '',
    description: string = ''
): 'opex' | 'capex' {
    const combined = `${rawType} ${category} ${description}`.toLowerCase()

    // Explicit check
    if (rawType.toLowerCase().includes('capex') || rawType.toLowerCase().includes('capital')) {
        return 'capex'
    }
    if (rawType.toLowerCase().includes('opex') || rawType.toLowerCase().includes('operating')) {
        return 'opex'
    }

    // Keyword check for CapEx
    for (const kw of CAPEX_KEYWORDS) {
        if (combined.includes(kw)) {
            return 'capex'
        }
    }

    // Default to OpEx
    return 'opex'
}

export function matchOpExCategory(category: string, description: string = ''): keyof ManualBranchPL {
    const combined = `${category} ${description}`.toLowerCase()
    for (const mapping of OPEX_CATEGORY_MAP) {
        for (const kw of mapping.keywords) {
            if (combined.includes(kw)) {
                return mapping.key
            }
        }
    }
    return 'general_admin'
}

export function cleanAmount(val: any): number {
    if (typeof val === 'number') return isNaN(val) ? 0 : Math.abs(val)
    if (!val) return 0
    const cleaned = String(val).replace(/[₹$,\s]/g, '')
    const num = parseFloat(cleaned)
    return isNaN(num) ? 0 : Math.abs(num)
}

/**
 * Parse rows from workbook / raw array of objects
 */
export function parseExpenseRows(
    rawRows: any[],
    defaultBranch: string = 'Bengaluru'
): { parsed: ParsedExpenseRow[]; summary: ImportExpenseSummary } {
    const parsed: ParsedExpenseRow[] = []
    let invalidCount = 0

    for (const row of rawRows) {
        if (!row || typeof row !== 'object') continue

        // Extract columns by fuzzy header matching
        let dateVal: any = null
        let branchVal: any = null
        let typeVal: any = null
        let catVal: any = null
        let descVal: any = null
        let amountVal: any = null

        for (const [k, v] of Object.entries(row)) {
            const key = k.toLowerCase().replace(/[^a-z0-9]/g, '')
            if (['date', 'dt', 'txndate', 'period', 'month', 'expensedate'].includes(key)) dateVal = v
            else if (['branch', 'location', 'salon', 'outlet'].includes(key)) branchVal = v
            else if (['type', 'expensetype', 'nature', 'classification', 'opexcapex'].includes(key)) typeVal = v
            else if (['category', 'head', 'account', 'particulars', 'expensecategory'].includes(key)) catVal = v
            else if (['description', 'details', 'narration', 'notes', 'vendor', 'remarks', 'item'].includes(key)) descVal = v
            else if (['amount', 'amt', 'cost', 'total', 'value', 'inr', 'price', 'paid'].includes(key)) amountVal = v
        }

        const dateObj = parseExcelDate(dateVal)
        const amount = cleanAmount(amountVal)

        if (!dateObj || amount <= 0) {
            invalidCount++
            continue
        }

        const branch = normalizeBranchName(branchVal, defaultBranch)
        const catStr = String(catVal || '').trim()
        const descStr = String(descVal || '').trim()
        const typeStr = String(typeVal || '').trim()

        const type = classifyExpenseType(typeStr, catStr, descStr)
        const matchedOpExKey = type === 'opex' ? matchOpExCategory(catStr, descStr) : undefined

        parsed.push({
            date: dateObj.iso,
            monthKey: dateObj.monthKey,
            branch,
            type,
            category: catStr || (type === 'capex' ? 'Capital Asset' : 'General & Admin'),
            matchedOpExKey,
            amount,
            description: descStr || `${type.toUpperCase()} entry`,
            rawRow: row,
        })
    }

    // Build aggregate summary
    const monthsSet = new Set<string>()
    const branchesSet = new Set<string>()
    let totalOpEx = 0
    let totalCapEx = 0

    const byMonthAndBranch: ImportExpenseSummary['byMonthAndBranch'] = {}

    for (const item of parsed) {
        monthsSet.add(item.monthKey)
        branchesSet.add(item.branch)

        if (!byMonthAndBranch[item.monthKey]) byMonthAndBranch[item.monthKey] = {}
        if (!byMonthAndBranch[item.monthKey][item.branch]) {
            byMonthAndBranch[item.monthKey][item.branch] = {
                opexTotal: 0,
                capexTotal: 0,
                opexByCategory: {},
                capexItems: [],
                opexItems: [],
            }
        }

        const target = byMonthAndBranch[item.monthKey][item.branch]
        if (item.type === 'opex') {
            totalOpEx += item.amount
            target.opexTotal += item.amount
            const key = item.matchedOpExKey || 'general_admin'
            target.opexByCategory[key] = (target.opexByCategory[key] || 0) + item.amount
            target.opexItems.push({
                id: `opex-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                date: item.date,
                title: item.description,
                category: item.category,
                amount: item.amount,
                notes: item.category !== item.description ? item.category : undefined,
            })
        } else {
            totalCapEx += item.amount
            target.capexTotal += item.amount
            target.capexItems.push({
                id: `capex-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                date: item.date,
                title: item.description,
                category: item.category,
                amount: item.amount,
                notes: item.category !== item.description ? item.category : undefined,
            })
        }
    }

    return {
        parsed,
        summary: {
            totalRows: parsed.length,
            totalOpEx,
            totalCapEx,
            months: Array.from(monthsSet).sort(),
            branches: Array.from(branchesSet).sort(),
            byMonthAndBranch,
            invalidRowsCount: invalidCount,
        },
    }
}

/**
 * Parse an Excel File (.xlsx, .xls) or CSV
 */
export async function parseExcelFile(file: File, defaultBranch: string = 'Bengaluru') {
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const rawRows = XLSX.utils.sheet_to_json(worksheet)
    return parseExpenseRows(rawRows, defaultBranch)
}

/**
 * Parse pasted text (CSV or Tab-Separated from Excel copy-paste)
 */
export function parsePastedExcelText(text: string, defaultBranch: string = 'Bengaluru') {
    const workbook = XLSX.read(text, { type: 'string' })
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    const rawRows = XLSX.utils.sheet_to_json(worksheet)
    return parseExpenseRows(rawRows, defaultBranch)
}

/**
 * Generate a ready-to-use sample Excel workbook file and trigger download
 */
export function downloadSampleExcelTemplate() {
    const sampleRows = [
        {
            Date: '2025-08-01',
            Branch: 'Bengaluru',
            Type: 'OpEx',
            Category: 'Rent/Lease',
            Amount: 45000,
            Description: 'Monthly Salon Premises Rent - Bengaluru Central',
        },
        {
            Date: '2025-08-03',
            Branch: 'Bengaluru',
            Type: 'OpEx',
            Category: 'Salaries and Wages',
            Amount: 65000,
            Description: 'Senior Stylists & Assistant Staff Payroll',
        },
        {
            Date: '2025-08-05',
            Branch: 'Bengaluru',
            Type: 'OpEx',
            Category: 'Utilities',
            Amount: 9200,
            Description: 'BESCOM Electricity Bill & High-Speed Wi-Fi',
        },
        {
            Date: '2025-08-08',
            Branch: 'Bengaluru',
            Type: 'OpEx',
            Category: 'Repairs and Maintenance',
            Amount: 3200,
            Description: 'Salon Hair Wash Basin Plumbing & AC filter clean',
        },
        {
            Date: '2025-08-10',
            Branch: 'Bengaluru',
            Type: 'CapEx',
            Category: 'Salon Equipment',
            Amount: 85000,
            Description: '3x Premium Hydraulic Leather Styling Chairs',
        },
        {
            Date: '2025-08-12',
            Branch: 'Bengaluru',
            Type: 'CapEx',
            Category: 'Salon Equipment',
            Amount: 42000,
            Description: 'Hydra Facial 7-in-1 Skin Care Machine',
        },
        {
            Date: '2025-08-15',
            Branch: 'Bengaluru',
            Type: 'CapEx',
            Category: 'Renovation & Fitouts',
            Amount: 35000,
            Description: 'LED Backlit Vanity Styling Mirrors & Wall Mounts',
        },
        {
            Date: '2025-08-18',
            Branch: 'Kalaburagi',
            Type: 'OpEx',
            Category: 'Rent/Lease',
            Amount: 30000,
            Description: 'Salon Branch Rent - Kalaburagi',
        },
        {
            Date: '2025-08-20',
            Branch: 'Kalaburagi',
            Type: 'OpEx',
            Category: 'Salaries and Wages',
            Amount: 48000,
            Description: 'Staff Wages & Stylist Commission Guarantee',
        },
        {
            Date: '2025-08-22',
            Branch: 'Kalaburagi',
            Type: 'CapEx',
            Category: 'Interior & AC',
            Amount: 48000,
            Description: 'Daikin 2.0 Ton Inverter Split Air Conditioner Unit',
        },
    ]

    const worksheet = XLSX.utils.json_to_sheet(sampleRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'OpEx_and_CapEx_Template')
    XLSX.writeFile(workbook, 'Christalin_Mirrors_OpEx_CapEx_Template.xlsx')
}
