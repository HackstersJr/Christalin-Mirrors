import { useEffect, useRef, useState } from 'react'
import {
    Printer, Bluetooth, Copy, Check, Download, QrCode,
    Barcode, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react'
import QRCode from 'qrcode'
import JsBarcode from 'jsbarcode'
import type { Invoice } from '../data/types'
import { getBranchAddress } from '../../data/branches'
import {
    generate32ColReceiptText,
    calculateEan13,
    generateUpiPaymentString,
    printInvoiceViaBluetooth,
    SEZNIK_LINE_WIDTH
} from '../utils/seznikVeerPrinter'
import './SeznikVeerReceipt.css'

interface Props {
    invoice: Invoice
    onClose?: () => void
    initialCompact?: boolean
}

export default function SeznikVeerReceipt({ invoice, onClose, initialCompact = false }: Props) {
    const barcodeRef = useRef<SVGSVGElement | null>(null)
    const [qrDataUrl, setQrDataUrl] = useState<string>('')
    const [showUpiQr, setShowUpiQr] = useState<boolean>(true)
    const [showBarcode, setShowBarcode] = useState<boolean>(true)
    const [barcodeType, setBarcodeType] = useState<'ean13' | 'code128'>('ean13')
    const [upiVpa, setUpiVpa] = useState<string>('christalinmirrors@okaxis')
    const [isCopied, setIsCopied] = useState<boolean>(false)
    const [isBtPrinting, setIsBtPrinting] = useState<boolean>(false)
    const [btMessage, setBtMessage] = useState<{ text: string; error?: boolean } | null>(null)
    const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false)

    const branchAddress = getBranchAddress(invoice.branch)
    const ean13Code = calculateEan13(invoice.invoiceNumber)

    // Generate strict 32-column plain text
    const receipt32ColText = generate32ColReceiptText(invoice, {
        branchAddress,
        upiVpa,
        showUpiQr,
        showEan13: showBarcode,
    })

    // Generate UPI QR Code image
    useEffect(() => {
        if (!showUpiQr) {
            setQrDataUrl('')
            return
        }
        const upiString = generateUpiPaymentString(invoice, upiVpa)
        QRCode.toDataURL(upiString, {
            width: 140,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#ffffff',
            },
            errorCorrectionLevel: 'M',
        })
            .then(url => setQrDataUrl(url))
            .catch(() => setQrDataUrl(''))
    }, [invoice, upiVpa, showUpiQr])

    // Generate EAN-13 / Code128 Barcode
    useEffect(() => {
        if (!showBarcode || !barcodeRef.current) return
        try {
            if (barcodeType === 'ean13') {
                JsBarcode(barcodeRef.current, ean13Code, {
                    format: 'EAN13',
                    width: 1.4,
                    height: 42,
                    displayValue: true,
                    font: 'monospace',
                    fontSize: 11,
                    textMargin: 3,
                    margin: 0,
                    lineColor: '#000000',
                    background: '#ffffff',
                })
            } else {
                JsBarcode(barcodeRef.current, invoice.invoiceNumber, {
                    format: 'CODE128',
                    width: 1.2,
                    height: 40,
                    displayValue: true,
                    font: 'monospace',
                    fontSize: 10,
                    textMargin: 3,
                    margin: 0,
                    lineColor: '#000000',
                    background: '#ffffff',
                })
            }
        } catch (_) {
            // Graceful fallback to Code128 if EAN13 format error
            if (barcodeRef.current) {
                try {
                    JsBarcode(barcodeRef.current, invoice.invoiceNumber, {
                        format: 'CODE128',
                        width: 1.2,
                        height: 40,
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
            // Fallback removal in case afterprint does not fire in some browsers
            setTimeout(() => {
                document.body.classList.remove('seznik-printing-active')
            }, 3000)
        }, 80)
    }

    // Direct Web Bluetooth Print (SEZNIK Veer / MPT-II via @point-of-sale packages)
    const handleBluetoothPrint = async () => {
        setIsBtPrinting(true)
        setBtMessage(null)
        try {
            const res = await printInvoiceViaBluetooth(invoice, {
                branchAddress,
                upiVpa,
                showUpiQr,
                showEan13: showBarcode,
            })
            setBtMessage({ text: res.message, error: !res.success })
        } catch (err: any) {
            setBtMessage({ text: err.message || 'Bluetooth connection error.', error: true })
        } finally {
            setIsBtPrinting(false)
        }
    }

    // Copy exact 32-col plain text
    const handleCopyText = async () => {
        try {
            await navigator.clipboard.writeText(receipt32ColText)
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 2000)
        } catch (_) {}
    }

    // Download formatted .txt file
    const handleDownloadTxt = () => {
        const blob = new Blob([receipt32ColText], { type: 'text/plain;charset=utf-8' })
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
                        SEZNIK Veer (MPT-II · 58mm)
                    </span>
                    <span className="seznik-spec-pill">
                        {SEZNIK_LINE_WIDTH} Chars/Line (Font A)
                    </span>
                    <span className="seznik-spec-pill">
                        CP437 ASCII
                    </span>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                        type="button"
                        className="admin-btn admin-btn-primary"
                        onClick={handleThermalPrint}
                        style={{ background: '#10b981', borderColor: '#10b981', color: '#fff', gap: 6, fontWeight: 600 }}
                        title="Open thermal print dialog (pre-formatted for 58mm continuous roll)"
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
                        <span>{isCopied ? 'Copied 32-Col' : 'Copy Text'}</span>
                    </button>

                    <button
                        type="button"
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                        onClick={handleDownloadTxt}
                        style={{ gap: 5 }}
                        title="Download raw plain text / PRN spool file"
                    >
                        <Download size={13} />
                        <span>Download .TXT</span>
                    </button>

                    <button
                        type="button"
                        className="admin-btn admin-btn-ghost admin-btn-sm"
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        style={{ gap: 4 }}
                    >
                        <span>Options</span>
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

            {/* Optional Settings Panel */}
            {isSettingsOpen && (
                <div
                    className="no-print"
                    style={{
                        width: '100%',
                        maxWidth: 580,
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 8,
                        padding: '12px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        fontSize: 12,
                    }}
                >
                    <div style={{ fontWeight: 600, color: 'var(--text-bright)' }}>
                        SEZNIK Veer Thermal Print Configuration:
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={showUpiQr}
                                onChange={e => setShowUpiQr(e.target.checked)}
                            />
                            <span>Include UPI QR Code</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={showBarcode}
                                onChange={e => setShowBarcode(e.target.checked)}
                            />
                            <span>Include Barcode</span>
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
                    {showUpiQr && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: 'var(--text-muted)' }}>UPI VPA:</span>
                            <input
                                className="admin-form-input"
                                value={upiVpa}
                                onChange={e => setUpiVpa(e.target.value)}
                                placeholder="salon@upi"
                                style={{ padding: '4px 8px', fontSize: 12, flex: 1 }}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* ─── PHYSICAL 58mm ROLL PREVIEW & PRINT TARGET ───────── */}
            <div id="seznik-thermal-target" className="seznik-roll-paper">
                {/* Monospace 32-column Plain Text Header & Body */}
                <pre className="seznik-mono-text">
                    {receipt32ColText}
                </pre>

                {/* Optional Dynamic UPI Payment QR Code */}
                {showUpiQr && qrDataUrl && (
                    <div className="seznik-qr-section">
                        <img
                            src={qrDataUrl}
                            alt="UPI Payment QR Code"
                            className="seznik-qr-img"
                        />
                        <div className="seznik-qr-caption">Scan to Pay via UPI</div>
                        <div style={{ fontSize: '8px', color: '#333', fontFamily: 'monospace' }}>
                            {invoice.total ? `Amount: Rs.${invoice.total.toLocaleString('en-IN')}` : ''}
                        </div>
                    </div>
                )}

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
