import { useState, useRef } from 'react'
import { X, Upload, Download, FileText, CheckCircle2, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react'
import type { AttendanceRecord, StaffMember } from '../data/types'
import { attendanceStore } from '../data/store'
import { useToast } from './Toast'
import { formatTimeForInput } from './EditAttendanceModal'

interface BulkImportAttendanceModalProps {
    isOpen: boolean
    onClose: () => void
    onImported: () => void
    staffList: StaffMember[]
    isOwner: boolean
}

interface ParsedAttendanceRow {
    rawStaffName: string
    rawDate: string
    rawStatus: string
    rawPunchIn: string
    rawPunchOut: string
    rawNotes: string
    matchedStaff?: StaffMember
    parsedDate?: string
    parsedStatus?: AttendanceRecord['status']
    parsedPunchIn?: string
    parsedPunchOut?: string
    isValid: boolean
    errorReason?: string
}

export default function BulkImportAttendanceModal({
    isOpen,
    onClose,
    onImported,
    staffList,
    isOwner,
}: BulkImportAttendanceModalProps) {
    const { showToast } = useToast()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [fileName, setFileName] = useState('')
    const [parsedRows, setParsedRows] = useState<ParsedAttendanceRow[]>([])
    const [isImporting, setIsImporting] = useState(false)
    const [isDragOver, setIsDragOver] = useState(false)

    if (!isOpen) return null

    // Generate and download a sample CSV template pre-filled with actual active staff
    const handleDownloadTemplate = () => {
        const today = new Date().toISOString().split('T')[0]
        const headers = ['Staff Name', 'Date', 'Status', 'Punch In', 'Punch Out', 'Notes']
        const sampleStaff = staffList.slice(0, 4)

        const rows = sampleStaff.length > 0 ? sampleStaff.map((s, idx) => {
            const status = idx === 0 ? 'present' : idx === 1 ? 'present' : idx === 2 ? 'half-day' : 'leave'
            const punchIn = status === 'leave' ? '' : '09:30 AM'
            const punchOut = status === 'leave' ? '' : (status === 'half-day' ? '01:30 PM' : '06:30 PM')
            const notes = status === 'half-day' ? 'Half day morning shift' : (status === 'leave' ? 'Sick leave' : 'Regular shift')
            return [
                `"${s.name}"`,
                today,
                status,
                punchIn,
                punchOut,
                `"${notes}"`
            ].join(',')
        }) : [
            '"Soniya"', today, 'present', '09:30 AM', '06:30 PM', '"Regular shift"',
            '"Bangalore Manager"', today, 'present', '10:00 AM', '07:00 PM', '"Full day"'
        ]

        const csvContent = [headers.join(','), ...rows].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', `Christalin_Mirrors_Attendance_Template_${today}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        showToast('info', 'Sample CSV template downloaded.')
    }

    // CSV text parser
    const parseCSVText = (text: string) => {
        const lines = text.split(/\r\n|\n|\r/).filter(line => line.trim().length > 0)
        if (lines.length < 2) {
            showToast('error', 'CSV file appears empty or missing header row.')
            return
        }

        // Parse header row
        const headerCols = lines[0].split(',').map(c => c.trim().toLowerCase().replace(/^["']|["']$/g, ''))
        const staffColIdx = headerCols.findIndex(c => c.includes('staff') || c.includes('name') || c.includes('employee'))
        const dateColIdx = headerCols.findIndex(c => c.includes('date') || c.includes('day'))
        const statusColIdx = headerCols.findIndex(c => c.includes('status'))
        const inColIdx = headerCols.findIndex(c => c.includes('in') || c.includes('punch_in') || c.includes('punch in'))
        const outColIdx = headerCols.findIndex(c => c.includes('out') || c.includes('punch_out') || c.includes('punch out'))
        const notesColIdx = headerCols.findIndex(c => c.includes('note') || c.includes('reason') || c.includes('remark'))

        const rows: ParsedAttendanceRow[] = []

        // Parse each data line (supporting simple commas inside quotes)
        const parseLine = (line: string): string[] => {
            const result: string[] = []
            let cur = ''
            let inQuotes = false
            for (let i = 0; i < line.length; i++) {
                const char = line[i]
                if (char === '"' || char === "'") {
                    inQuotes = !inQuotes
                } else if (char === ',' && !inQuotes) {
                    result.push(cur.trim())
                    cur = ''
                } else {
                    cur += char
                }
            }
            result.push(cur.trim())
            return result
        }

        for (let i = 1; i < lines.length; i++) {
            const cols = parseLine(lines[i])
            if (cols.length === 0 || cols.every(c => c === '')) continue

            const rawStaffName = (staffColIdx >= 0 ? cols[staffColIdx] : cols[0]) || ''
            const rawDate = (dateColIdx >= 0 ? cols[dateColIdx] : cols[1]) || ''
            const rawStatus = (statusColIdx >= 0 ? cols[statusColIdx] : cols[2]) || 'present'
            const rawPunchIn = inColIdx >= 0 ? cols[inColIdx] : (cols[3] || '')
            const rawPunchOut = outColIdx >= 0 ? cols[outColIdx] : (cols[4] || '')
            const rawNotes = notesColIdx >= 0 ? cols[notesColIdx] : (cols[5] || '')

            // 1. Match staff
            const cleanStaffQuery = rawStaffName.toLowerCase().replace(/['"]/g, '').trim()
            const matchedStaff = staffList.find(s => {
                const sName = s.name.toLowerCase()
                return sName === cleanStaffQuery || sName.includes(cleanStaffQuery) || cleanStaffQuery.includes(sName) || s.id === cleanStaffQuery
            })

            // 2. Parse Date
            let parsedDate: string | undefined
            const cleanDate = rawDate.replace(/['"]/g, '').trim()
            // YYYY-MM-DD
            if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(cleanDate)) {
                const [y, m, d] = cleanDate.split('-')
                parsedDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
            } else if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(cleanDate)) {
                // DD/MM/YYYY or DD-MM-YYYY
                const parts = cleanDate.split(/[/-]/)
                parsedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
            }

            // 3. Parse Status
            let parsedStatus: AttendanceRecord['status'] | undefined
            const sLower = rawStatus.toLowerCase().replace(/['"]/g, '').trim()
            if (sLower === 'p' || sLower.includes('present')) parsedStatus = 'present'
            else if (sLower === 'h' || sLower.includes('half')) parsedStatus = 'half-day'
            else if (sLower === 'l' || sLower.includes('leave')) parsedStatus = 'leave'
            else if (sLower === 'a' || sLower.includes('absent')) parsedStatus = 'absent'

            // 4. Punch Times
            const parsedPunchIn = formatTimeForInput(rawPunchIn)
            const parsedPunchOut = formatTimeForInput(rawPunchOut)

            // Validation check
            let isValid = true
            let errorReason = ''

            if (!matchedStaff) {
                isValid = false
                errorReason = `Staff "${rawStaffName}" not found in roster`
            } else if (!parsedDate) {
                isValid = false
                errorReason = `Invalid date format "${rawDate}" (use YYYY-MM-DD or DD/MM/YYYY)`
            } else if (!parsedStatus) {
                isValid = false
                errorReason = `Unknown status "${rawStatus}" (use present, half-day, leave, absent)`
            }

            rows.push({
                rawStaffName,
                rawDate,
                rawStatus,
                rawPunchIn,
                rawPunchOut,
                rawNotes,
                matchedStaff,
                parsedDate,
                parsedStatus,
                parsedPunchIn,
                parsedPunchOut,
                isValid,
                errorReason,
            })
        }

        setParsedRows(rows)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setFileName(file.name)
        const reader = new FileReader()
        reader.onload = evt => {
            const text = evt.target?.result as string
            if (text) parseCSVText(text)
        }
        reader.readAsText(file)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
        const file = e.dataTransfer.files?.[0]
        if (!file) return
        setFileName(file.name)
        const reader = new FileReader()
        reader.onload = evt => {
            const text = evt.target?.result as string
            if (text) parseCSVText(text)
        }
        reader.readAsText(file)
    }

    const handleExecuteImport = async () => {
        if (!isOwner) {
            showToast('error', 'Only the Owner account can bulk import attendance records.')
            return
        }

        const validRows = parsedRows.filter(r => r.isValid && r.matchedStaff && r.parsedDate && r.parsedStatus)
        if (validRows.length === 0) {
            showToast('error', 'No valid attendance records to import.')
            return
        }

        setIsImporting(true)
        let successCount = 0
        try {
            for (const r of validRows) {
                const s = r.matchedStaff!
                await attendanceStore.mark(
                    s.id,
                    s.name,
                    s.branch,
                    r.parsedDate!,
                    r.parsedStatus!,
                    {
                        punchIn: r.parsedPunchIn || undefined,
                        punchOut: r.parsedPunchOut || undefined,
                        notes: r.rawNotes?.replace(/['"]/g, '').trim() || undefined,
                        updatedBy: 'owner_csv_import'
                    }
                )
                successCount++
            }
            showToast('success', `Successfully imported ${successCount} attendance records!`)
            onImported()
            onClose()
        } catch (err) {
            console.error('Bulk import error', err)
            showToast('error', `Imported ${successCount} records, but encountered an error.`)
        } finally {
            setIsImporting(false)
        }
    }

    const validCount = parsedRows.filter(r => r.isValid).length
    const invalidCount = parsedRows.length - validCount

    return (
        <div className="admin-modal-overlay" onClick={onClose}>
            <div className="admin-modal-card" style={{ maxWidth: 760 }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="admin-modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Upload size={18} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: 16 }}>
                                Bulk Import Staff Attendance (CSV)
                            </h3>
                            <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>
                                ★ Owner Exclusive Management Action
                            </span>
                        </div>
                    </div>
                    <button className="admin-modal-close-btn" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                {!isOwner && (
                    <div style={{ margin: '14px 0', padding: 12, borderRadius: 8, background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', gap: 10, alignItems: 'center', color: '#ef4444', fontSize: 13 }}>
                        <AlertCircle size={18} style={{ flexShrink: 0 }} />
                        <span>Owner role required to execute CSV bulk attendance imports.</span>
                    </div>
                )}

                {/* CSV Format Guide */}
                <div style={{ margin: '16px 0', padding: 14, borderRadius: 10, background: 'var(--bg-card-alt)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Required CSV Column Format
                        </span>
                        <button
                            type="button"
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            onClick={handleDownloadTemplate}
                            style={{ gap: 6 }}
                        >
                            <Download size={13} style={{ color: 'var(--accent)' }} />
                            <span>Download Sample CSV Template</span>
                        </button>
                    </div>

                    <div style={{ fontFamily: 'monospace', fontSize: 11, background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 6, color: 'var(--text-primary)', overflowX: 'auto', whiteSpace: 'nowrap', border: '1px solid var(--border-light)' }}>
                        Staff Name,Date,Status,Punch In,Punch Out,Notes
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, marginTop: 10, fontSize: 11, color: 'var(--text-dim)' }}>
                        <div>• <strong>Staff Name:</strong> Full or partial name (e.g. Soniya, Priya)</div>
                        <div>• <strong>Date:</strong> YYYY-MM-DD or DD/MM/YYYY</div>
                        <div>• <strong>Status:</strong> present, half-day, leave, or absent</div>
                        <div>• <strong>Punch In / Out:</strong> HH:MM (e.g. 09:30 or 09:30 AM)</div>
                    </div>
                </div>

                {/* Drag and Drop Zone */}
                <div
                    onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                        padding: 24,
                        borderRadius: 10,
                        border: isDragOver ? '2px dashed var(--accent)' : '2px dashed var(--border-strong)',
                        background: isDragOver ? 'rgba(212, 175, 55, 0.08)' : 'var(--bg-card)',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        marginBottom: 16
                    }}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,text/csv,text/plain"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                    <FileText size={28} style={{ color: fileName ? 'var(--accent)' : 'var(--text-muted)', margin: '0 auto 8px' }} />
                    <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {fileName ? fileName : 'Click to select CSV file, or drag and drop here'}
                    </p>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                        Compatible with Excel, Google Sheets, or Biometric Punch export (.csv)
                    </span>
                </div>

                {/* Parsed Preview Table */}
                {parsedRows.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
                                Preview & Validation ({parsedRows.length} rows found)
                            </span>
                            <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <CheckCircle2 size={13} /> {validCount} Valid
                                </span>
                                {invalidCount > 0 && (
                                    <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <AlertTriangle size={13} /> {invalidCount} Invalid
                                    </span>
                                )}
                            </div>
                        </div>

                        <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                            <table className="admin-table" style={{ margin: 0, fontSize: 12 }}>
                                <thead>
                                    <tr>
                                        <th>Status</th>
                                        <th>Staff</th>
                                        <th>Date</th>
                                        <th>Attendance</th>
                                        <th>Punch In</th>
                                        <th>Punch Out</th>
                                        <th>Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedRows.map((r, i) => (
                                        <tr key={i} style={{ background: !r.isValid ? 'rgba(239, 68, 68, 0.06)' : undefined }}>
                                            <td>
                                                {r.isValid ? (
                                                    <span style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                                                        <CheckCircle2 size={14} /> Ready
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: 4 }} title={r.errorReason}>
                                                        <AlertTriangle size={14} /> Error
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ fontWeight: 600 }}>
                                                {r.matchedStaff ? (
                                                    <span>{r.matchedStaff.name} <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>({r.matchedStaff.branch})</span></span>
                                                ) : (
                                                    <span style={{ color: '#ef4444' }}>{r.rawStaffName || '—'}</span>
                                                )}
                                            </td>
                                            <td>{r.parsedDate || <span style={{ color: '#ef4444' }}>{r.rawDate}</span>}</td>
                                            <td>
                                                <span className={`status-badge ${r.parsedStatus === 'present' ? 'confirmed' : r.parsedStatus === 'half-day' ? 'pending' : 'cancelled'}`} style={{ textTransform: 'capitalize' }}>
                                                    {r.parsedStatus || r.rawStatus}
                                                </span>
                                            </td>
                                            <td>{r.parsedPunchIn || '—'}</td>
                                            <td>{r.parsedPunchOut || '—'}</td>
                                            <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {r.isValid ? (r.rawNotes || '—') : <span style={{ color: '#ef4444', fontSize: 11 }}>{r.errorReason}</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Footer Controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
                    <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose} disabled={isImporting}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="admin-btn admin-btn-primary"
                        onClick={handleExecuteImport}
                        disabled={!isOwner || validCount === 0 || isImporting}
                        style={{ gap: 6 }}
                    >
                        <Sparkles size={14} />
                        <span>{isImporting ? 'Importing Records...' : `Import ${validCount} Valid Records`}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
