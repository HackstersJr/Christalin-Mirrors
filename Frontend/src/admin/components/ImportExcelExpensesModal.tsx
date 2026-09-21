import React, { useState, useRef } from 'react'
import {
    Upload, FileSpreadsheet, Download, Check, AlertCircle,
    X, ArrowRight, Layers, DollarSign, Calendar, MapPin,
    FileText, Sparkles, RefreshCw, Trash2
} from 'lucide-react'
import {
    parseExcelFile,
    parsePastedExcelText,
    downloadSampleExcelTemplate,
    type ParsedExpenseRow,
    type ImportExpenseSummary,
} from '../data/excelExpenseParser'
import { manualProfitLossStore } from '../data/manualProfitLossStore'
import './ImportExcelExpensesModal.css'

interface Props {
    isOpen: boolean
    onClose: () => void
    defaultBranch: string
    currentMonthKey: string
    onImportSuccess: (summary: ImportExpenseSummary, affectedMonths: string[]) => void
}

export default function ImportExcelExpensesModal({
    isOpen,
    onClose,
    defaultBranch,
    currentMonthKey,
    onImportSuccess,
}: Props) {
    const [tab, setTab] = useState<'upload' | 'paste'>('upload')
    const [isDragging, setIsDragging] = useState(false)
    const [fileName, setFileName] = useState<string | null>(null)
    const [pastedText, setPastedText] = useState('')
    const [isParsing, setIsParsing] = useState(false)
    const [parseError, setParseError] = useState<string | null>(null)
    const [parsedData, setParsedData] = useState<{
        parsed: ParsedExpenseRow[]
        summary: ImportExpenseSummary
    } | null>(null)
    const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge')
    const [selectedBranchOverride, setSelectedBranchOverride] = useState(defaultBranch)

    const fileInputRef = useRef<HTMLInputElement>(null)

    if (!isOpen) return null

    const handleFile = async (file: File) => {
        if (!file) return
        setFileName(file.name)
        setIsParsing(true)
        setParseError(null)

        try {
            const result = await parseExcelFile(file, selectedBranchOverride)
            if (result.parsed.length === 0) {
                setParseError('No valid expense or capex rows found in the sheet. Please ensure columns include Date, Amount, and Category/Type.')
                setParsedData(null)
            } else {
                setParsedData(result)
            }
        } catch (err: any) {
            console.error('Failed to parse Excel file', err)
            setParseError(`Could not read spreadsheet file: ${err.message || 'Unknown error'}. Try using .xlsx, .xls, or .csv.`)
            setParsedData(null)
        } finally {
            setIsParsing(false)
        }
    }

    const handlePasteParse = () => {
        if (!pastedText.trim()) return
        setIsParsing(true)
        setParseError(null)

        try {
            const result = parsePastedExcelText(pastedText, selectedBranchOverride)
            if (result.parsed.length === 0) {
                setParseError('No valid rows recognized from pasted text. Ensure you copy the table headers (Date, Amount, Category) along with the data rows.')
                setParsedData(null)
            } else {
                setParsedData(result)
            }
        } catch (err: any) {
            console.error('Failed to parse pasted text', err)
            setParseError('Unable to parse clipboard data. Ensure it is copied from Excel or a CSV table.')
            setParsedData(null)
        } finally {
            setIsParsing(false)
        }
    }

    const handleApply = () => {
        if (!parsedData) return
        const count = manualProfitLossStore.applyExcelImportSummary(parsedData.summary, importMode)
        onImportSuccess(parsedData.summary, parsedData.summary.months)
        onClose()
    }

    const resetState = () => {
        setFileName(null)
        setPastedText('')
        setParsedData(null)
        setParseError(null)
    }

    return (
        <div className="import-excel-overlay" onClick={onClose}>
            <div className="import-excel-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="import-excel-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div className="import-excel-icon-badge">
                            <FileSpreadsheet size={22} className="text-primary" />
                        </div>
                        <div>
                            <h2 className="import-excel-title">Import OpEx &amp; CapEx from Excel</h2>
                            <p className="import-excel-subtitle">
                                Upload or paste your salon operating expenses and capital expenditure spreadsheet
                            </p>
                        </div>
                    </div>
                    <button className="import-excel-close-btn" onClick={onClose} aria-label="Close modal">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="import-excel-body">
                    {/* Instructions Banner & Template Download */}
                    <div className="import-excel-guide-banner">
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <Sparkles size={18} className="text-primary" style={{ flexShrink: 0, marginTop: 2 }} />
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-bright)' }}>
                                    Automatic OpEx vs CapEx Classification
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                                    Your Excel can include columns: <code>Date</code>, <code>Branch</code>, <code>Type</code> (OpEx/CapEx), <code>Category</code> (Rent, Salaries, Utilities, Equipment, etc.), <code>Amount</code>, and <code>Description</code>.
                                </div>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            onClick={() => downloadSampleExcelTemplate()}
                            style={{ whiteSpace: 'nowrap', gap: 6 }}
                        >
                            <Download size={14} /> Download Sample Template
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="import-excel-tabs">
                        <button
                            type="button"
                            className={`import-excel-tab ${tab === 'upload' ? 'active' : ''}`}
                            onClick={() => { setTab('upload'); resetState() }}
                        >
                            <Upload size={15} /> Upload File (.xlsx, .xls, .csv)
                        </button>
                        <button
                            type="button"
                            className={`import-excel-tab ${tab === 'paste' ? 'active' : ''}`}
                            onClick={() => { setTab('paste'); resetState() }}
                        >
                            <FileText size={15} /> Paste from Clipboard
                        </button>
                    </div>

                    {/* Tab 1: File Upload */}
                    {tab === 'upload' && (
                        <div
                            className={`import-excel-dropzone ${isDragging ? 'dragging' : ''} ${fileName ? 'has-file' : ''}`}
                            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={e => {
                                e.preventDefault()
                                setIsDragging(false)
                                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                    handleFile(e.dataTransfer.files[0])
                                }
                            }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                style={{ display: 'none' }}
                                onChange={e => {
                                    if (e.target.files && e.target.files[0]) {
                                        handleFile(e.target.files[0])
                                    }
                                }}
                            />

                            {fileName ? (
                                <div className="dropzone-file-info">
                                    <FileSpreadsheet size={36} className="text-primary" />
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{fileName}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        Click or drop another file to replace
                                    </div>
                                </div>
                            ) : (
                                <div className="dropzone-empty-info">
                                    <Upload size={36} className="text-muted" />
                                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-bright)' }}>
                                        Drag &amp; drop your Excel file here, or <span className="text-primary" style={{ textDecoration: 'underline' }}>browse</span>
                                    </div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                        Supports Microsoft Excel (.xlsx, .xls) and CSV sheets
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Tab 2: Paste from Clipboard */}
                    {tab === 'paste' && (
                        <div>
                            <textarea
                                className="import-excel-textarea"
                                placeholder={`Copy rows directly from Excel or Google Sheets (including headers) and paste here:\n\nDate\tBranch\tType\tCategory\tAmount\tDescription\n2025-08-01\tBengaluru\tOpEx\tRent/Lease\t45000\tSalon premises rent\n2025-08-10\tBengaluru\tCapEx\tSalon Equipment\t85000\tHydraulic Styling Chairs`}
                                value={pastedText}
                                onChange={e => setPastedText(e.target.value)}
                                rows={7}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                                <button
                                    type="button"
                                    className="admin-btn admin-btn-secondary admin-btn-sm"
                                    onClick={handlePasteParse}
                                    disabled={!pastedText.trim() || isParsing}
                                >
                                    {isParsing ? 'Parsing…' : 'Parse Pasted Cells'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Error Notice */}
                    {parseError && (
                        <div className="import-excel-error-banner">
                            <AlertCircle size={16} style={{ flexShrink: 0 }} />
                            <span>{parseError}</span>
                        </div>
                    )}

                    {/* Parse Result Summary */}
                    {parsedData && (
                        <div className="import-excel-summary-box">
                            <div className="summary-headline">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <Check size={18} className="text-success" />
                                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-bright)' }}>
                                        Successfully Parsed {parsedData.summary.totalRows} Entries
                                    </span>
                                </div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                                    Months: {parsedData.summary.months.join(', ')} · Branches: {parsedData.summary.branches.join(', ')}
                                </div>
                            </div>

                            {/* Two Pillars: OpEx vs CapEx */}
                            <div className="summary-pillars-grid">
                                <div className="summary-pillar opex">
                                    <div className="pillar-header">
                                        <div className="pillar-tag opex">OPERATING EXPENSES (OpEx)</div>
                                        <div className="pillar-amount">
                                            ₹{Math.round(parsedData.summary.totalOpEx).toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                    <p className="pillar-desc">
                                        Flows into monthly P&amp;L (Rent, Salaries, Utilities, Maintenance, Taxes)
                                    </p>
                                </div>

                                <div className="summary-pillar capex">
                                    <div className="pillar-header">
                                        <div className="pillar-tag capex">CAPITAL EXPENDITURE (CapEx)</div>
                                        <div className="pillar-amount">
                                            ₹{Math.round(parsedData.summary.totalCapEx).toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                    <p className="pillar-desc">
                                        Asset investments (Styling chairs, facial machines, ACs, renovation)
                                    </p>
                                </div>
                            </div>

                            {/* Sample Preview Table */}
                            <div style={{ marginTop: 16 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Preview of Parsed Transactions ({Math.min(6, parsedData.parsed.length)} of {parsedData.parsed.length} shown)
                                </div>
                                <div className="table-scroll" style={{ maxHeight: 170 }}>
                                    <table className="admin-table import-preview-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Branch</th>
                                                <th>Type</th>
                                                <th>Category</th>
                                                <th>Description</th>
                                                <th style={{ textAlign: 'right' }}>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedData.parsed.slice(0, 6).map((r, i) => (
                                                <tr key={i}>
                                                    <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{r.date}</td>
                                                    <td style={{ fontSize: 12 }}>{r.branch}</td>
                                                    <td>
                                                        <span className={`badge-type ${r.type}`}>
                                                            {r.type.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: 12 }}>{r.category}</td>
                                                    <td style={{ fontSize: 12, maxWidth: 180 }} className="cell-truncate">
                                                        {r.description}
                                                    </td>
                                                    <td style={{ textAlign: 'right', fontWeight: 600, fontSize: 12 }}>
                                                        ₹{Math.round(r.amount).toLocaleString('en-IN')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Import Mode Selection */}
                            <div className="import-mode-selection">
                                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-bright)' }}>
                                    Import Behavior:
                                </span>
                                <label className="import-mode-label">
                                    <input
                                        type="radio"
                                        name="importMode"
                                        checked={importMode === 'merge'}
                                        onChange={() => setImportMode('merge')}
                                    />
                                    <span>Merge / Add to existing amounts</span>
                                </label>
                                <label className="import-mode-label">
                                    <input
                                        type="radio"
                                        name="importMode"
                                        checked={importMode === 'replace'}
                                        onChange={() => setImportMode('replace')}
                                    />
                                    <span>Overwrite / Replace OpEx for these months</span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="import-excel-footer">
                    <button
                        type="button"
                        className="admin-btn admin-btn-ghost"
                        onClick={onClose}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="admin-btn admin-btn-primary"
                        onClick={handleApply}
                        disabled={!parsedData || parsedData.parsed.length === 0}
                        style={{ gap: 8 }}
                    >
                        <Check size={16} />
                        Apply {parsedData ? `${parsedData.parsed.length} Records` : 'to Statement'}
                    </button>
                </div>
            </div>
        </div>
    )
}
