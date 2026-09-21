import { googleAuthService } from './googleAuthService'
import { manualSalesStore, type ManualSalesData } from './manualSalesStore'
import { manualProfitLossStore, type ManualBranchPL } from './manualProfitLossStore'
import { parseExcelDate, classifyExpenseType, matchOpExCategory } from './excelExpenseParser'

export interface GoogleSheetConfig {
    spreadsheetId: string
    spreadsheetUrl: string
    spreadsheetTitle?: string
    dailySalesTab: string
    expensesTab: string
    autoSyncOnSave: boolean
    lastSyncedAt: string | null
    syncDirection: 'two-way' | 'pull-only' | 'push-only'
}

export interface SyncResult {
    success: boolean
    message: string
    pulledSales: number
    pushedSales: number
    pulledExpenses: number
    pushedExpenses: number
    timestamp: string
    error?: string
}

const STORAGE_CONFIG_KEY = 'cm_google_sheets_config_v2'
const DEFAULT_BRANCHES = ['Bengaluru', 'Kalaburagi', 'Belgaum', 'Manea', 'Upcoming Branch 1 (Yelahanka)', 'Upcoming Branch 2 (Hassan)']

export function extractSpreadsheetId(urlOrId: string): string | null {
    if (!urlOrId) return null
    const trimmed = urlOrId.trim()
    // Match standard docs.google.com/spreadsheets/d/{ID}/...
    const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    if (match && match[1]) {
        return match[1]
    }
    // Check if it's already a raw ID (typically 44 chars alphanumeric with _ and -)
    if (/^[a-zA-Z0-9-_]{20,60}$/.test(trimmed)) {
        return trimmed
    }
    return null
}

export const googleSheetsSyncService = {
    getConfig(): GoogleSheetConfig {
        try {
            const raw = localStorage.getItem(STORAGE_CONFIG_KEY)
            if (raw) {
                return JSON.parse(raw)
            }
        } catch (e) {
            console.error('Failed to load Google Sheets config', e)
        }
        return {
            spreadsheetId: '',
            spreadsheetUrl: '',
            spreadsheetTitle: '',
            dailySalesTab: 'Daily Sales',
            expensesTab: 'Expenses & CapEx',
            autoSyncOnSave: false,
            lastSyncedAt: null,
            syncDirection: 'two-way',
        }
    },

    saveConfig(cfg: Partial<GoogleSheetConfig>): GoogleSheetConfig {
        const current = this.getConfig()
        const updated = { ...current, ...cfg }
        try {
            localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(updated))
        } catch (e) {
            console.error('Failed to save Google Sheets config', e)
        }
        return updated
    },

    /**
     * Inspect spreadsheet metadata: title and tab sheets list
     */
    async getSpreadsheetMetadata(spreadsheetId: string, accessToken?: string) {
        const token = accessToken || googleAuthService.getAccessToken()
        if (!token) {
            throw new Error('Not signed in to Google. Please sign in with your Google account first.')
        }

        const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })

        if (!res.ok) {
            const errBody = await res.text()
            if (res.status === 403) {
                throw new Error('Access denied. Make sure you have permission to edit this spreadsheet and accepted Google Sheets scopes.')
            } else if (res.status === 404) {
                throw new Error('Spreadsheet not found. Please verify the link or ID.')
            }
            throw new Error(`Google Sheets API error (${res.status}): ${errBody}`)
        }

        const data = await res.json()
        const tabs: string[] = (data.sheets || []).map((s: any) => s.properties?.title).filter(Boolean)
        return {
            title: data.properties?.title || 'Google Spreadsheet',
            tabs,
        }
    },

    /**
     * Initialize standard tabs in existing spreadsheet if they do not exist
     */
    async initializeStandardTabs(spreadsheetId: string, token: string, tabsToCreate: string[]) {
        const meta = await this.getSpreadsheetMetadata(spreadsheetId, token)
        const existingTabs = new Set(meta.tabs)

        const requests: any[] = []
        for (const tabName of tabsToCreate) {
            if (!existingTabs.has(tabName)) {
                requests.push({
                    addSheet: {
                        properties: { title: tabName },
                    },
                })
            }
        }

        if (requests.length > 0) {
            const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ requests }),
            })
            if (!res.ok) {
                console.warn('Batch update to add tabs failed or already exists', await res.text())
            }
        }

        // Add headers for Daily Sales if new/empty
        try {
            await this.writeDailySalesHeaders(spreadsheetId, token, 'Daily Sales')
        } catch (e) {
            console.warn('Could not write daily sales header', e)
        }

        // Add headers for Expenses & CapEx if new/empty
        try {
            await this.writeExpensesHeaders(spreadsheetId, token, 'Expenses & CapEx')
        } catch (e) {
            console.warn('Could not write expenses header', e)
        }
    },

    async writeDailySalesHeaders(spreadsheetId: string, token: string, tabName: string) {
        const range = `${encodeURIComponent(tabName)}!A1:G1`
        const headers = [['Date', 'Branch', 'Client Count', 'Service Sales (₹)', 'Retail Sales (₹)', 'Total Revenue (₹)', 'Notes / Remarks']]
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                range: `${tabName}!A1:G1`,
                majorDimension: 'ROWS',
                values: headers,
            }),
        })
    },

    async writeExpensesHeaders(spreadsheetId: string, token: string, tabName: string) {
        const range = `${encodeURIComponent(tabName)}!A1:F1`
        const headers = [['Date', 'Branch', 'Type (OpEx / CapEx)', 'Category', 'Amount (₹)', 'Description']]
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                range: `${tabName}!A1:F1`,
                majorDimension: 'ROWS',
                values: headers,
            }),
        })
    },

    /**
     * PULL: Reads Daily Sales rows from Google Sheets and merges into local store
     */
    async pullDailySales(spreadsheetId: string, token: string, tabName: string): Promise<number> {
        const range = `${encodeURIComponent(tabName)}!A1:Z1000`
        const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
            headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
            const err = await res.text()
            throw new Error(`Failed to read Daily Sales tab "${tabName}": ${err}`)
        }

        const data = await res.json()
        const rows: any[][] = data.values || []
        if (rows.length < 2) return 0 // Only headers or empty

        const headers = rows[0].map((h: any) => String(h || '').trim().toLowerCase())

        // Find column indexes dynamically
        const dateIdx = headers.findIndex(h => h.includes('date') || h === 'day')
        const branchIdx = headers.findIndex(h => h.includes('branch') || h.includes('location') || h.includes('salon'))
        const clientIdx = headers.findIndex(h => h.includes('client') || h.includes('customer') || h.includes('count') || h.includes('bill'))
        const serviceIdx = headers.findIndex(h => h.includes('service') || h.includes('hair') || h.includes('treatment'))
        const retailIdx = headers.findIndex(h => h.includes('retail') || h.includes('product'))
        const notesIdx = headers.findIndex(h => h.includes('note') || h.includes('remark') || h.includes('desc'))

        if (dateIdx === -1) {
            throw new Error(`The sheet "${tabName}" does not have a recognizable "Date" column header.`)
        }

        const allSales = manualSalesStore.getAll()
        let updatedCount = 0

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i]
            if (!row || row.length === 0) continue

            const rawDate = row[dateIdx]
            if (!rawDate) continue
            const parsedDate = parseExcelDate(rawDate)
            if (!parsedDate) continue

            let branch = branchIdx !== -1 && row[branchIdx] ? String(row[branchIdx]).trim() : DEFAULT_BRANCHES[0]
            // Standardize branch name
            const lowerB = branch.toLowerCase()
            if (lowerB.includes('manea') || lowerB.includes('mane')) branch = 'Manea'
            else if (lowerB.includes('kala') || lowerB.includes('gul')) branch = 'Kalaburagi'
            else if (lowerB.includes('belg') || lowerB.includes('bgm')) branch = 'Belgaum'
            else if (lowerB.includes('yelahanka') || lowerB.includes('upcoming 1')) branch = 'Upcoming Branch 1 (Yelahanka)'
            else if (lowerB.includes('hassan') || lowerB.includes('upcoming 2')) branch = 'Upcoming Branch 2 (Hassan)'
            else if (lowerB.includes('beng') || lowerB.includes('blr')) branch = 'Bengaluru'

            const rawClient = clientIdx !== -1 ? row[clientIdx] : 0
            const rawService = serviceIdx !== -1 ? row[serviceIdx] : 0
            const rawRetail = retailIdx !== -1 ? row[retailIdx] : 0
            const rawNotes = notesIdx !== -1 ? String(row[notesIdx] || '').trim() : ''

            const clientCount = Math.max(0, parseInt(String(rawClient).replace(/[^\d]/g, ''), 10) || 0)
            const service = Math.max(0, parseFloat(String(rawService).replace(/[^\d.-]/g, '')) || 0)
            const retail = Math.max(0, parseFloat(String(rawRetail).replace(/[^\d.-]/g, '')) || 0)

            if (!allSales[branch]) allSales[branch] = {}

            // Merge: preserve notes if present
            const existing = allSales[branch][parsedDate.iso]
            allSales[branch][parsedDate.iso] = {
                clientCount: clientCount || existing?.clientCount || 0,
                service: service || existing?.service || 0,
                retail: retail || existing?.retail || 0,
                notes: rawNotes || existing?.notes || '',
            }
            updatedCount++
        }

        manualSalesStore.saveAll(allSales)
        return updatedCount
    },

    /**
     * PUSH: Writes all local Daily Sales records into Google Sheet
     */
    async pushDailySales(spreadsheetId: string, token: string, tabName: string): Promise<number> {
        const allSales = manualSalesStore.getAll()

        // Read existing rows first so we know what's there
        const range = `${encodeURIComponent(tabName)}!A1:Z1000`
        let existingRows: any[][] = []
        try {
            const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
                const d = await res.json()
                existingRows = d.values || []
            }
        } catch (e) {
            console.warn('Could not read existing rows before push', e)
        }

        // Map existing rows by Date + Branch to preserve row positions or update cleanly
        const existingKeyToRowIndex = new Map<string, number>()
        if (existingRows.length > 1) {
            const headers = existingRows[0].map((h: any) => String(h || '').trim().toLowerCase())
            const dIdx = headers.findIndex(h => h.includes('date') || h === 'day')
            const bIdx = headers.findIndex(h => h.includes('branch') || h.includes('location'))

            if (dIdx !== -1) {
                for (let r = 1; r < existingRows.length; r++) {
                    const row = existingRows[r]
                    const d = parseExcelDate(row[dIdx])
                    const b = bIdx !== -1 && row[bIdx] ? String(row[bIdx]).trim() : 'Bengaluru'
                    if (d) {
                        existingKeyToRowIndex.set(`${b}_${d}`, r)
                    }
                }
            }
        }

        // Flatten all local records
        const flatList: { date: string; branch: string; clientCount: number; service: number; retail: number; notes: string }[] = []
        for (const [branch, dateMap] of Object.entries(allSales)) {
            if (branch === 'all') continue
            for (const [date, rec] of Object.entries(dateMap)) {
                if (rec.clientCount > 0 || rec.service > 0 || rec.retail > 0 || (rec.notes && rec.notes.trim())) {
                    flatList.push({
                        date,
                        branch,
                        clientCount: rec.clientCount,
                        service: rec.service,
                        retail: rec.retail,
                        notes: rec.notes || '',
                    })
                }
            }
        }

        // Sort chronologically then by branch
        flatList.sort((a, b) => a.date.localeCompare(b.date) || a.branch.localeCompare(b.branch))

        // Reconstruct the table values
        const rowsOutput: (string | number)[][] = [
            ['Date', 'Branch', 'Client Count', 'Service Sales (₹)', 'Retail Sales (₹)', 'Total Revenue (₹)', 'Notes / Remarks'],
        ]

        for (const item of flatList) {
            const totalRev = (item.service || 0) + (item.retail || 0)
            rowsOutput.push([
                item.date,
                item.branch,
                item.clientCount,
                item.service,
                item.retail,
                totalRev,
                item.notes,
            ])
        }

        // Write full table
        const writeRange = `${encodeURIComponent(tabName)}!A1:G${rowsOutput.length}`
        const putRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${writeRange}?valueInputOption=USER_ENTERED`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                range: `${tabName}!A1:G${rowsOutput.length}`,
                majorDimension: 'ROWS',
                values: rowsOutput,
            }),
        })

        if (!putRes.ok) {
            const err = await putRes.text()
            throw new Error(`Failed to push Daily Sales to Google Sheet: ${err}`)
        }

        return flatList.length
    },

    /**
     * PULL: Reads Expenses & CapEx rows from Google Sheets and merges into Profit & Loss
     */
    async pullExpenses(spreadsheetId: string, token: string, tabName: string): Promise<number> {
        const range = `${encodeURIComponent(tabName)}!A1:Z1000`
        const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`, {
            headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) {
            // Expenses tab may not exist yet, that's fine
            return 0
        }

        const data = await res.json()
        const rows: any[][] = data.values || []
        if (rows.length < 2) return 0

        const headers = rows[0].map((h: any) => String(h || '').trim().toLowerCase())
        const dateIdx = headers.findIndex(h => h.includes('date'))
        const branchIdx = headers.findIndex(h => h.includes('branch') || h.includes('location'))
        const typeIdx = headers.findIndex(h => h.includes('type'))
        const catIdx = headers.findIndex(h => h.includes('category') || h.includes('item') || h.includes('head'))
        const amtIdx = headers.findIndex(h => h.includes('amount') || h.includes('cost') || h.includes('price') || h.includes('exp'))
        const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('remark') || h.includes('particular'))

        if (dateIdx === -1 || amtIdx === -1) {
            return 0
        }

        const byMonthAndBranch: Record<string, Record<string, {
            opexTotal: number
            capexTotal: number
            opexByCategory: Partial<Record<keyof ManualBranchPL, number>>
            capexItems: any[]
            opexItems: any[]
        }>> = {}

        let count = 0

        for (let i = 1; i < rows.length; i++) {
            const r = rows[i]
            if (!r || r.length === 0) continue

            const rawDate = r[dateIdx]
            const parsedDate = parseExcelDate(rawDate)
            if (!parsedDate) continue

            const monthKey = parsedDate.monthKey
            let branch = branchIdx !== -1 && r[branchIdx] ? String(r[branchIdx]).trim() : 'Bengaluru'
            const lowerB = branch.toLowerCase()
            if (lowerB.includes('manea') || lowerB.includes('mane')) branch = 'Manea'
            else if (lowerB.includes('kala') || lowerB.includes('gul')) branch = 'Kalaburagi'
            else if (lowerB.includes('belg') || lowerB.includes('bgm')) branch = 'Belgaum'
            else if (lowerB.includes('yelahanka') || lowerB.includes('upcoming 1')) branch = 'Upcoming Branch 1 (Yelahanka)'
            else if (lowerB.includes('hassan') || lowerB.includes('upcoming 2')) branch = 'Upcoming Branch 2 (Hassan)'
            else if (lowerB.includes('beng') || lowerB.includes('blr')) branch = 'Bengaluru'

            const rawType = typeIdx !== -1 ? r[typeIdx] : ''
            const rawCat = catIdx !== -1 ? r[catIdx] : ''
            const rawDesc = descIdx !== -1 ? String(r[descIdx] || '').trim() : ''
            const amt = Math.max(0, parseFloat(String(r[amtIdx]).replace(/[^\d.-]/g, '')) || 0)

            if (amt <= 0) continue

            const expType = classifyExpenseType(rawType, rawCat, rawDesc)

            if (!byMonthAndBranch[monthKey]) byMonthAndBranch[monthKey] = {}
            if (!byMonthAndBranch[monthKey][branch]) {
                byMonthAndBranch[monthKey][branch] = {
                    opexTotal: 0,
                    capexTotal: 0,
                    opexByCategory: {},
                    capexItems: [],
                    opexItems: [],
                }
            }

            const target = byMonthAndBranch[monthKey][branch]

            if (expType === 'capex') {
                target.capexTotal += amt
                target.capexItems.push({
                    id: `gs-capex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    date: parsedDate.iso,
                    title: rawDesc || rawCat || 'CapEx Equipment',
                    category: rawCat || 'Equipment',
                    amount: amt,
                })
            } else {
                target.opexTotal += amt
                const opexKey = matchOpExCategory(rawCat, rawDesc)
                target.opexByCategory[opexKey] = (target.opexByCategory[opexKey] || 0) + amt
                target.opexItems.push({
                    id: `gs-opex-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    date: parsedDate.iso,
                    title: rawDesc || rawCat || 'Operating Expense',
                    category: rawCat || 'General Expense',
                    amount: amt,
                })
            }
            count++
        }

        if (count > 0) {
            manualProfitLossStore.applyExcelImportSummary({ byMonthAndBranch }, 'merge')
        }

        return count
    },

    /**
     * PUSH: Writes CapEx and OpEx entries into Google Sheet Expenses tab
     */
    async pushExpenses(spreadsheetId: string, token: string, tabName: string): Promise<number> {
        const allPL = manualProfitLossStore.getAll()
        const rowsOutput: (string | number)[][] = [
            ['Date', 'Branch', 'Type (OpEx / CapEx)', 'Category', 'Amount (₹)', 'Description'],
        ]

        let count = 0
        for (const [monthKey, branchMap] of Object.entries(allPL)) {
            for (const [branch, pl] of Object.entries(branchMap)) {
                // Add recorded CapEx items
                if (pl.capex_items && pl.capex_items.length > 0) {
                    for (const item of pl.capex_items) {
                        rowsOutput.push([
                            item.date || `${monthKey}-01`,
                            branch,
                            'CapEx',
                            item.category,
                            item.amount,
                            item.title,
                        ])
                        count++
                    }
                } else if ((pl.capex || 0) > 0) {
                    rowsOutput.push([
                        `${monthKey}-01`,
                        branch,
                        'CapEx',
                        'Salon Equipment',
                        pl.capex || 0,
                        `Monthly CapEx Total for ${monthKey}`,
                    ])
                    count++
                }

                // Add recorded itemized OpEx items if any
                if (pl.opex_items && pl.opex_items.length > 0) {
                    for (const item of pl.opex_items) {
                        rowsOutput.push([
                            item.date || `${monthKey}-01`,
                            branch,
                            'OpEx',
                            item.category,
                            item.amount,
                            item.title || item.notes || '',
                        ])
                        count++
                    }
                }
            }
        }

        if (rowsOutput.length > 1) {
            const writeRange = `${encodeURIComponent(tabName)}!A1:F${rowsOutput.length}`
            const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${writeRange}?valueInputOption=USER_ENTERED`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    range: `${tabName}!A1:F${rowsOutput.length}`,
                    majorDimension: 'ROWS',
                    values: rowsOutput,
                }),
            })
            if (!res.ok) {
                console.warn('Could not push expenses to sheet:', await res.text())
            }
        }

        return count
    },

    /**
     * Complete Full Two-Way Synchronization:
     * Pulls latest edits from Google Sheet, merges them locally, then pushes all updates back to Google Sheet.
     */
    async performSync(): Promise<SyncResult> {
        const config = this.getConfig()
        const token = googleAuthService.getAccessToken()

        if (!config.spreadsheetId) {
            throw new Error('No Google Spreadsheet ID configured. Please paste your Google Sheet link.')
        }
        if (!token) {
            throw new Error('Please sign in with Google first to authorize Google Sheets synchronization.')
        }

        let pulledSales = 0
        let pushedSales = 0
        let pulledExpenses = 0
        let pushedExpenses = 0

        try {
            // Ensure standard tabs exist
            await this.initializeStandardTabs(config.spreadsheetId, token, [config.dailySalesTab, config.expensesTab])

            // Direction: Two-way or Pull-only
            if (config.syncDirection === 'two-way' || config.syncDirection === 'pull-only') {
                pulledSales = await this.pullDailySales(config.spreadsheetId, token, config.dailySalesTab)
                pulledExpenses = await this.pullExpenses(config.spreadsheetId, token, config.expensesTab)
            }

            // Direction: Two-way or Push-only
            if (config.syncDirection === 'two-way' || config.syncDirection === 'push-only') {
                pushedSales = await this.pushDailySales(config.spreadsheetId, token, config.dailySalesTab)
                pushedExpenses = await this.pushExpenses(config.spreadsheetId, token, config.expensesTab)
            }

            const nowIso = new Date().toISOString()
            this.saveConfig({ lastSyncedAt: nowIso })

            return {
                success: true,
                message: `Two-way sync completed successfully with "${config.spreadsheetTitle || 'Google Sheet'}".`,
                pulledSales,
                pushedSales,
                pulledExpenses,
                pushedExpenses,
                timestamp: nowIso,
            }
        } catch (err: any) {
            console.error('Two-way sync failed:', err)
            return {
                success: false,
                message: err.message || 'Sync failed due to an unexpected error.',
                pulledSales,
                pushedSales,
                pulledExpenses,
                pushedExpenses,
                timestamp: new Date().toISOString(),
                error: err.message,
            }
        }
    },
}
