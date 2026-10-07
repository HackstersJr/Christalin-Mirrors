import { useEffect, useRef, useState } from 'react'
import {
    Printer, Bluetooth, Copy, Check, Download,
    ChevronDown, ChevronUp, AlertCircle, MapPin
} from 'lucide-react'
import JsBarcode from 'jsbarcode'
import type { Invoice } from '../data/types'
import { getBranchAddress, getBranchPhone, saveCustomBranchAddress } from '../../data/branches'
import {
    generate32ColReceiptText,
    calculateEan13,
    printInvoiceViaBluetooth,
    SEZNIK_LINE_WIDTH
} from '../utils/seznikVeerPrinter'
import cmLogo from '../../assets/cm-logo-white.png'
import './SeznikVeerReceipt.css'

interface Props {
    invoice: Invoice
    onClose?: () => void
    initialCompact?: boolean
}

export default function SeznikVeerReceipt({ invoice, onClose, initialCompact = false }: Props) {
    const barcodeRef = useRef<SVGSVGElement | null>(null)
    const [showBarcode, setShowBarcode] = useState<boolean>(false)
    const [barcodeType, setBarcodeType] = useState<'ean13' | 'code128'>('ean13')
    const [isCopied, setIsCopied] = useState<boolean>(false)
    const [isBtPrinting, setIsBtPrinting] = useState<boolean>(false)
    const [btMessage, setBtMessage] = useState<{ text: string; error?: boolean } | null>(null)
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false)
    const [addressSaved, setAddressSaved] = useState<boolean>(false)
    const [addressSize, setAddressSize] = useState<'xs' | 'sm' | 'md'>('sm')

    const branchName = invoice.branch || 'Belgaum'
    const [customAddress, setCustomAddress] = useState<string>(() => getBranchAddress(branchName))
    const [customPhone, setCustomPhone] = useState<string>(() => getBranchPhone(branchName))

    useEffect(() => {
        setCustomAddress(getBranchAddress(branchName))
        setCustomPhone(getBranchPhone(branchName))
    }, [branchName])

    const ean13Code = calculateEan13(invoice.invoiceNumber)

    // Generate strict 32-column plain text for 58mm roll (omitBrandHeader & omitBranchInfoBlock so header & small address are rendered cleanly once above)
    const receipt32ColText = generate32ColReceiptText(invoice, {
        branchAddress: customAddress,
        branchPhone: customPhone,
        showUpiQr: false,
        showEan13: showBarcode,
        omitBrandHeader: true,
        omitBranchInfoBlock: true,
    })

    // Full 32-col text including ASCII branding for raw .txt download and copy
    const fullReceipt32ColText = generate32ColReceiptText(invoice, {
        branchAddress: customAddress,
        branchPhone: customPhone,
        showUpiQr: false,
        showEan13: showBarcode,
        omitBrandHeader: false,
        omitBranchInfoBlock: false,
    })

    // Generate optional EAN-13 / Code128 Barcode
    useEffect(() => {
        if (!showBarcode || !barcodeRef.current) return
        try {
            if (barcodeType === 'ean13') {
                JsBarcode(barcodeRef.current, ean13Code, {
                    format: 'EAN13',
                    width: 1.4,
                    height: 40,
                    displayValue: true,
                    font: 'monospace',
                    fontSize: 10,
                    textMargin: 2,
                    margin: 0,
                    lineColor: '#000000',
                    background: '#ffffff',
                })
            } else {
                JsBarcode(barcodeRef.current, invoice.invoiceNumber, {
                    format: 'CODE128',
                    width: 1.2,
                    height: 38,
                    displayValue: true,
                    font: 'monospace',
                    fontSize: 10,
                    textMargin: 2,
                    margin: 0,
                    lineColor: '#000000',
                    background: '#ffffff',
                })
            }
        } catch (_) {
            if (barcodeRef.current) {
                try {
                    JsBarcode(barcodeRef.current, invoice.invoiceNumber, {
                        format: 'CODE128',
                        width: 1.2,
                        height: 38,
                        displayValue: true,
                        margin: 0,
                    })
                } catch (__) {}
            }
        }
    }, [invoice, showBarcode, barcodeType, ean13Code])

    // Print to SEZNIK Veer (58mm Thermal Print Roll)
    const handleThermalPrint = () => {
        document.body.classList.add('seznik-printing-active')
        const handleAfterPrint = () => {
            document.body.classList.remove('seznik-printing-active')
            window.removeEventListener('afterprint', handleAfterPrint)
        }
        window.addEventListener('afterprint', handleAfterPrint)
        setTimeout(() => {
            window.print()
            setTimeout(() => {
                document.body.classList.remove('seznik-printing-active')
            }, 3000)
        }, 80)
    }

    // Direct Web Bluetooth Print (SEZNIK Veer / MPT-II)
    const handleBluetoothPrint = async () => {
        setIsBtPrinting(true)
        setBtMessage(null)
        try {
            const res = await printInvoiceViaBluetooth(invoice, {
                branchAddress: customAddress,
                branchPhone: customPhone,
                showUpiQr: false,
                showEan13: showBarcode,
            })
            setBtMessage({ text: res.message, error: !res.success })
        } catch (err: any) {
            setBtMessage({ text: err.message || 'Bluetooth connection error.', error: true })
        } finally {
            setIsBtPrinting(false)
        }
    }

    // Save custom address for this branch
    const handleSaveAddress = () => {
        saveCustomBranchAddress(branchName, customAddress)
        setAddressSaved(true)
        setTimeout(() => setAddressSaved(false), 2000)
    }

    // Copy exact 32-col plain text
    const handleCopyText = async () => {
        try {
            await navigator.clipboard.writeText(fullReceipt32ColText)
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 2000)
        } catch (_) {}
    }

    // Download formatted .txt file
    const handleDownloadTxt = () => {
        const blob = new Blob([fullReceipt32ColText], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${invoice.invoiceNumber}_seznik_58mm.txt`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="seznik-receipt-wrapper">
            {/* Header info badge & Quick Actions */}
            <div className="seznik-toolbar no-print">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span className="seznik-printer-badge">
                        <Printer size={13} />
                        SEZNIK Veer (58mm · MPT-II)
                    </span>
                    <span className="seznik-spec-pill">
                        {SEZNIK_LINE_WIDTH} Chars/Line
                    </span>
                    <span className="seznik-spec-pill" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                        Branch: {branchName}
                    </span>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        className="admin-btn admin-btn-primary"
                        onClick={handleThermalPrint}
                        style={{ background: '#10b981', borderColor: '#10b981', color: '#fff', gap: 6, fontWeight: 600 }}
                        title="Print bill on 58mm thermal roll"
                    >
                        <Printer size={14} />
                        <span>Print Bill (58mm)</span>
                    </button>

                    <button
                        type="button"
                        className="admin-btn admin-btn-secondary"
                        onClick={handleBluetoothPrint}
                        disabled={isBtPrinting}
                        style={{ gap: 6 }}
                        title="Direct Bluetooth pairing with SEZNIK Veer without OS print dialog"
                    >
                        <Bluetooth size={14} style={{ color: '#38bdf8' }} />
                        <span>{isBtPrinting ? 'Pairing…' : 'Bluetooth Print'}</span>
                    </button>

                    <button
                        type="button"
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                        onClick={handleCopyText}
                        style={{ gap: 5 }}
                        title="Copy exact 32-column text"
                    >
                        {isCopied ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
                        <span>{isCopied ? 'Copied' : 'Copy Text'}</span>
                    </button>

                    <button
                        type="button"
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                        onClick={handleDownloadTxt}
                        style={{ gap: 5 }}
                        title="Download raw plain text / PRN spool file"
                    >
                        <Download size={13} />
                        <span>.TXT</span>
                    </button>

                    <button
                        type="button"
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        style={{ gap: 4 }}
                    >
                        <span>Branch Address &amp; Options</span>
                        {isSettingsOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                </div>
            </div>

            {/* Bluetooth feedback notification */}
            {btMessage && (
                <div
                    className="no-print"
                    style={{
                        padding: '8px 14px',
                        borderRadius: 6,
                        fontSize: 12,
                        width: '100%',
                        maxWidth: 580,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        background: btMessage.error ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                        color: btMessage.error ? '#ef4444' : '#10b981',
                        border: `1px solid ${btMessage.error ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                    }}
                >
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>{btMessage.text}</span>
                </div>
            )}

            {/* Branch Address & Thermal Print Options Drawer */}
            {isSettingsOpen && (
                <div
                    className="no-print"
                    style={{
                        width: '100%',
                        maxWidth: 580,
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 8,
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        fontSize: 12,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <MapPin size={14} style={{ color: 'var(--color-primary, #b59458)' }} />
                            <span>Address for {branchName} Branch:</span>
                        </div>
                        {addressSaved && (
                            <span style={{ color: '#10b981', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <Check size={12} /> Saved for {branchName}!
                            </span>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            className="admin-form-input"
                            value={customAddress}
                            onChange={e => setCustomAddress(e.target.value)}
                            placeholder="e.g. Ground Floor, Shop No. 2 Jadhav Nagar, Belagavi 590019"
                            style={{ flex: 1, padding: '6px 10px', fontSize: 12 }}
                        />
                        <button
                            type="button"
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            onClick={handleSaveAddress}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            Save for Branch
                        </button>
                        <button
                            type="button"
                            className="admin-btn admin-btn-ghost admin-btn-sm"
                            onClick={() => setCustomAddress(getBranchAddress(branchName))}
                            title="Reset to default address"
                        >
                            Reset
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>Address Font:</span>
                            <select
                                className="admin-form-input"
                                value={addressSize}
                                onChange={e => setAddressSize(e.target.value as any)}
                                style={{ padding: '3px 8px', fontSize: 12 }}
                            >
                                <option value="xs">Extra Small (7px - ultra compact)</option>
                                <option value="sm">Small (8px - recommended)</option>
                                <option value="md">Medium (9px)</option>
                            </select>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={showBarcode}
                                onChange={e => setShowBarcode(e.target.checked)}
                            />
                            <span>Include EAN-13 Barcode</span>
                        </label>

                        {showBarcode && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>Type:</span>
                                <select
                                    className="admin-form-input"
                                    value={barcodeType}
                                    onChange={e => setBarcodeType(e.target.value as any)}
                                    style={{ padding: '3px 8px', fontSize: 12 }}
                                >
                                    <option value="ean13">EAN-13 (Standard 13-digit)</option>
                                    <option value="code128">Code-128 (Full Invoice No)</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ─── PHYSICAL 58mm ROLL PREVIEW & PRINT TARGET ───────── */}
            <div id="seznik-thermal-target" className="seznik-roll-paper">
                {/* Brand Logo & Name & Tagline at Top of Receipt (rendered ONCE) */}
                <div className="seznik-brand-header">
                    <img
                        src={cmLogo}
                        alt="Christalin Mirrors"
                        className="seznik-thermal-logo"
                    />
                    <div className="seznik-brand-title">CHRISTALIN MIRRORS</div>
                    <div className="seznik-brand-tagline">Refine · Reflect · Radiate</div>
                </div>

                {/* Branch Details Block with reduced address font */}
                <div className="seznik-branch-block">
                    <div className="seznik-branch-title">Branch: {branchName}</div>
                    <div className={`seznik-branch-address size-${addressSize}`}>
                        {customAddress}
                    </div>
                    <div className="seznik-branch-contact">
                        Ph: {customPhone} &bull; GSTIN: 29AAVFC4475G1ZU
                    </div>
                </div>

                <div className="seznik-divider-line">================================</div>

                {/* Monospace 32-column Plain Text: Inv details, Item Table, Totals with 2 decimals, and Clean Thank You Footer */}
                <pre className="seznik-mono-text">
                    {receipt32ColText}
                </pre>

                {/* Optional EAN-13 / Code-128 Barcode for Scanner Gun */}
                {showBarcode && (
                    <div className="seznik-barcode-section">
                        <svg ref={barcodeRef} className="seznik-barcode-svg" />
                    </div>
                )}
            </div>
        </div>
    )
}
