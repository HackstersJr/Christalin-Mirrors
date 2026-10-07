import { useState } from 'react'
import { Bluetooth, Download, Share2, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { Invoice } from '../data/types'
import { getBranchAddress, getBranchPhone } from '../../data/branches'
import { getBranchScope } from '../data/authStore'
import {
    generate32ColReceiptText,
    printInvoiceViaBluetooth,
    calculateEan13,
    SEZNIK_LINE_WIDTH
} from '../utils/seznikVeerPrinter'
import cmLogo from '../../assets/cm-logo-white.png'
import './SeznikVeerReceipt.css'

interface Props {
    invoice: Invoice
    onClose?: () => void
    initialCompact?: boolean
    hideToolbar?: boolean
}

// Generate 95-module EAN-13 barcode binary string for crisp SVG rendering
function getEan13Bits(ean13: string): string {
    const digits = (ean13.replace(/\D/g, '') + '0000000000000').slice(0, 13)
    const L: Record<string, string> = {
        '0': '0001101', '1': '0011001', '2': '0010011', '3': '0111101', '4': '0100011',
        '5': '0110001', '6': '0101111', '7': '0111011', '8': '0110111', '9': '0001011',
    }
    const G: Record<string, string> = {
        '0': '0100111', '1': '0110011', '2': '0011011', '3': '0100001', '4': '0011101',
        '5': '0111001', '6': '0000101', '7': '0010001', '8': '0001001', '9': '0010111',
    }
    const R: Record<string, string> = {
        '0': '1110010', '1': '1100110', '2': '1101100', '3': '1000010', '4': '1011100',
        '5': '1001110', '6': '1010000', '7': '1000100', '8': '1001000', '9': '1110100',
    }
    const PARITY: Record<string, string> = {
        '0': 'LLLLLL', '1': 'LLGLGG', '2': 'LLGGLG', '3': 'LLGGGL', '4': 'LGLLGG',
        '5': 'LGGLLG', '6': 'LGGGLL', '7': 'LGLGLG', '8': 'LGLGGL', '9': 'LGGLGL',
    }
    const parity = PARITY[digits[0]] || 'LLLLLL'
    let bits = '101' // left guard
    for (let i = 1; i <= 6; i++) {
        const d = digits[i]
        bits += parity[i - 1] === 'G' ? G[d] : L[d]
    }
    bits += '01010' // center guard
    for (let i = 7; i <= 12; i++) {
        bits += R[digits[i]]
    }
    bits += '101' // right guard
    return bits
}

export default function SeznikVeerReceipt({ invoice, onClose, hideToolbar }: Props) {
    const [isBtPrinting, setIsBtPrinting] = useState<boolean>(false)
    const [btMessage, setBtMessage] = useState<{ text: string; error?: boolean } | null>(null)

    // Automatically link branch from logged-in manager's profile, falling back to invoice branch or 'Belgaum'
    const managerBranch = getBranchScope()
    const branchName = managerBranch || invoice.branch || 'Belgaum'
    const branchAddress = getBranchAddress(branchName)
    const branchPhone = getBranchPhone(branchName)
    const ean13Code = calculateEan13(invoice.invoiceNumber)

    // Strict 32-column receipt text for thermal paper preview (brand header & branch block rendered once above)
    const receipt32ColText = generate32ColReceiptText(invoice, {
        branchName,
        branchAddress,
        branchPhone,
        showUpiQr: false,
        showEan13: false, // Visual barcode SVG is rendered cleanly below the text
        omitBrandHeader: true,
        omitBranchInfoBlock: true,
    })

    // Full 32-col text for downloadable file (includes ASCII EAN-13 code)
    const fullReceipt32ColText = generate32ColReceiptText(invoice, {
        branchName,
        branchAddress,
        branchPhone,
        showUpiQr: false,
        showEan13: true,
        omitBrandHeader: false,
        omitBranchInfoBlock: false,
    })

    // Direct Web Bluetooth Print (SEZNIK Veer / MPT-II 58mm Thermal Roll)
    const handleBluetoothPrint = async () => {
        setIsBtPrinting(true)
        setBtMessage(null)
        try {
            const res = await printInvoiceViaBluetooth(invoice, {
                branchName,
                branchAddress,
                branchPhone,
                showUpiQr: false,
                showEan13: true,
            })
            setBtMessage({ text: res.message, error: !res.success })
        } catch (err: any) {
            setBtMessage({ text: err.message || 'Bluetooth connection error.', error: true })
        } finally {
            setIsBtPrinting(false)
        }
    }

    // Share Receipt on WhatsApp
    const handleShareWhatsApp = () => {
        let text = `*Christalin Mirrors — ${branchName}*\n`
        text += `_Refine · Reflect · Radiate_\n\n`
        text += `*Invoice:* ${invoice.invoiceNumber}\n`
        text += `*Date:* ${new Date(invoice.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}\n`
        if (invoice.clientName) text += `*Client:* ${invoice.clientName}\n`
        if (invoice.stylist) text += `*Stylist:* ${invoice.stylist}\n`
        text += `\n*Services / Items:*\n`
        invoice.items.forEach(i => {
            if (!i.service) return
            text += `• ${i.service} (x${i.quantity}) — ₹${Number(i.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`
        })
        const taxable = Math.max(0, (invoice.subtotal || 0) - (invoice.discountAmount || 0))
        const halfRate = (invoice.taxPercent || 5) / 2
        const halfTax = Number(((taxable * halfRate) / 100).toFixed(2)) || Number(((invoice.taxAmount || 0) / 2).toFixed(2))
        text += `\nSubtotal: ₹${Number(invoice.subtotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`
        if (invoice.discountAmount > 0) {
            const discLabel = invoice.discountPercent > 0 ? `Discount (${invoice.discountPercent}%):` : 'Discount:'
            text += `${discLabel} -₹${Number(invoice.discountAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`
        }
        if (invoice.taxAmount > 0) {
            text += `CGST (${halfRate}%): ₹${halfTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`
            text += `SGST (${halfRate}%): ₹${halfTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`
        }
        text += `*Grand Total: ₹${Number(invoice.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*\n`
        text += `Payment Mode: ${(invoice.paymentMethod || 'CASH').toUpperCase()}\n\n`
        text += `*Branch:* ${branchName}\n`
        text += `${branchAddress}\n`
        text += `Ph: ${branchPhone}\n`
        text += `GSTIN: 29AAVFC4475G1ZU\n\n`
        text += `Thank you! Visit again.\n*Team Christalin Mirrors*`

        const phoneNum = (invoice.clientPhone || '').replace(/\D/g, '')
        const url = phoneNum
            ? `https://wa.me/${phoneNum.length === 10 ? '91' + phoneNum : phoneNum}?text=${encodeURIComponent(text)}`
            : `https://wa.me/?text=${encodeURIComponent(text)}`
        window.open(url, '_blank')
    }

    // Download formatted .txt file
    const handleDownloadTxt = () => {
        const blob = new Blob([fullReceipt32ColText], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${invoice.invoiceNumber}_${branchName.replace(/\s+/g, '_')}_bill.txt`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="seznik-receipt-wrapper">
            {/* Action Bar: Bluetooth Print ONLY, WhatsApp Share, Download (hidden if parent hosts toolbar) */}
            {!hideToolbar && (
                <div className="seznik-toolbar no-print">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span className="seznik-printer-badge">
                            <Bluetooth size={13} style={{ color: '#38bdf8' }} />
                            SEZNIK Veer (58mm BLE)
                        </span>
                        <span className="seznik-spec-pill" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', fontWeight: 600 }}>
                            Branch: {branchName}
                        </span>
                        {managerBranch && (
                            <span className="seznik-spec-pill" style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.1)' }}>
                                Linked Manager POS
                            </span>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* ONLY Bluetooth Print Option */}
                        <button
                            type="button"
                            className="admin-btn admin-btn-primary"
                            onClick={handleBluetoothPrint}
                            disabled={isBtPrinting}
                            style={{
                                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                                borderColor: '#0284c7',
                                color: '#ffffff',
                                fontWeight: 600,
                                gap: 7,
                                padding: '8px 16px',
                                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
                            }}
                            title="Connect and print receipt directly to SEZNIK Veer via Web Bluetooth"
                        >
                            <Bluetooth size={16} />
                            <span>{isBtPrinting ? 'Connecting SEZNIK Veer…' : 'Pair & Print (Bluetooth)'}</span>
                        </button>

                        {/* WhatsApp Share */}
                        <button
                            type="button"
                            className="admin-btn admin-btn-whatsapp"
                            onClick={handleShareWhatsApp}
                            style={{ gap: 6, fontWeight: 500 }}
                            title="Send receipt bill copy via WhatsApp"
                        >
                            <Share2 size={14} />
                            <span>Share WhatsApp</span>
                        </button>

                        {/* Download Button */}
                        <button
                            type="button"
                            className="admin-btn admin-btn-secondary"
                            onClick={handleDownloadTxt}
                            style={{ gap: 6 }}
                            title="Download receipt text file"
                        >
                            <Download size={14} />
                            <span>Download</span>
                        </button>

                        {onClose && (
                            <button
                                type="button"
                                className="admin-btn admin-btn-ghost admin-btn-sm"
                                onClick={onClose}
                            >
                                Close
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Bluetooth status feedback notification */}
            {btMessage && (
                <div
                    className="no-print"
                    style={{
                        padding: '9px 14px',
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
                    {btMessage.error ? (
                        <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    ) : (
                        <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                    )}
                    <span>{btMessage.text}</span>
                </div>
            )}

            {/* ─── PHYSICAL 58mm ROLL PREVIEW & PRINT TARGET ───────── */}
            <div id="seznik-thermal-target" className="seznik-roll-paper">
                {/* Brand Logo & Name & Tagline at Top of Receipt (rendered strictly ONCE) */}
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
                    <div className="seznik-branch-address size-sm">
                        {branchAddress}
                    </div>
                    <div className="seznik-branch-contact">
                        Ph: {branchPhone} &bull; GSTIN: 29AAVFC4475G1ZU
                    </div>
                </div>

                <div className="seznik-divider-line">================================</div>

                {/* Monospace 32-column Plain Text: Invoice details, Item Table, Totals with 2 decimals, and Clean Thank You Footer */}
                <pre className="seznik-mono-text">
                    {receipt32ColText}
                </pre>

                {/* EAN-13 Barcode Section */}
                <div className="seznik-barcode-section" style={{ width: '100%', marginTop: 2, paddingTop: 4, borderTop: '1px dashed #000' }}>
                    <svg
                        viewBox="0 0 95 36"
                        className="seznik-barcode-svg"
                        style={{ width: 135, height: 36, display: 'block', margin: '2px auto' }}
                    >
                        {getEan13Bits(ean13Code).split('').map((bit, idx) => (
                            bit === '1' ? (
                                <rect key={idx} x={idx} y={0} width={1} height={36} fill="#000000" />
                            ) : null
                        ))}
                    </svg>
                    <div style={{ fontSize: 9.5, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '2px', textAlign: 'center', color: '#000000', marginTop: 1 }}>
                        {ean13Code}
                    </div>
                </div>
            </div>
        </div>
    )
}
