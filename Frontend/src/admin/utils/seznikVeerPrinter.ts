/**
 * SEZNIK Veer (MPT-II Compatible) 58mm Thermal Printer Engine
 * ──────────────────────────────────────────────────────────────────
 * Specifications & Constraints:
 * - Printer Model: SEZNIK Veer (MPT-II compatible, 58mm / 2-inch roll width)
 * - Printable character width: Exactly 32 characters per line (Font A: 12x24)
 * - Codepage: CP437 (Standard ASCII / Western European)
 * - Features: Monospace plain text, ASCII formatting, QR Codes, EAN13 Barcodes
 */

import type { Invoice } from '../data/types'

export const SEZNIK_LINE_WIDTH = 32

/**
 * Replace non-CP437 characters (e.g. ₹ rupee symbol, em-dashes, fancy quotes, bullets)
 * with standard CP437-compatible ASCII equivalents so thermal printheads don't output garbage.
 */
export function toCp437Ascii(text: string): string {
    return text
        .replace(/₹/g, 'Rs.')
        .replace(/–|—/g, '--')
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/•|·/g, '-')
        .replace(/…/g, '...')
        .replace(/[^\x20-\x7E\r\n\t]/g, '') // Strip any non-ASCII characters outside standard CP437 printable range
}

/**
 * Right pad a string with spaces up to length
 */
export function padRight(text: string, length: number): string {
    const s = String(text)
    if (s.length >= length) return s.slice(0, length)
    return s + ' '.repeat(length - s.length)
}

/**
 * Left pad a string with spaces up to length
 */
export function padLeft(text: string, length: number): string {
    const s = String(text)
    if (s.length >= length) return s.slice(0, length)
    return ' '.repeat(length - s.length) + s
}

/**
 * Center a string within a 32-character line
 */
export function centerText(text: string, width = SEZNIK_LINE_WIDTH): string {
    const clean = toCp437Ascii(text)
    if (clean.length >= width) return clean.slice(0, width)
    const totalSpaces = width - clean.length
    const leftSpaces = Math.floor(totalSpaces / 2)
    const rightSpaces = totalSpaces - leftSpaces
    return ' '.repeat(leftSpaces) + clean + ' '.repeat(rightSpaces)
}

/**
 * Justify two text fragments across exactly 32 columns (left aligned and right aligned)
 */
export function justifyTwo(left: string, right: string, width = SEZNIK_LINE_WIDTH): string {
    const cleanLeft = toCp437Ascii(left)
    const cleanRight = toCp437Ascii(right)
    const gap = width - (cleanLeft.length + cleanRight.length)
    if (gap < 1) {
        // Truncate left to guarantee right is always visible within 32 chars
        const allowedLeft = Math.max(4, width - cleanRight.length - 1)
        return cleanLeft.slice(0, allowedLeft) + ' ' + cleanRight
    }
    return cleanLeft + ' '.repeat(gap) + cleanRight
}

/**
 * Wrap long item descriptions into lines <= maxWidth
 */
export function wrapText(text: string, maxWidth = SEZNIK_LINE_WIDTH): string[] {
    const clean = toCp437Ascii(text)
    if (clean.length <= maxWidth) return [clean]
    const words = clean.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
        if (!currentLine) {
            currentLine = word.slice(0, maxWidth)
        } else if ((currentLine + ' ' + word).length <= maxWidth) {
            currentLine += ' ' + word
        } else {
            lines.push(currentLine)
            currentLine = word.slice(0, maxWidth)
        }
    }
    if (currentLine) lines.push(currentLine)
    return lines
}

/**
 * Format currency amount for CP437 (using "Rs." prefix without Unicode rupee symbol)
 */
export function formatRs(amount: number): string {
    const fixed = Math.round(amount * 100) / 100
    const str = fixed % 1 === 0 ? fixed.toLocaleString('en-IN') : fixed.toFixed(2)
    return `Rs.${str}`
}

/**
 * Calculate standard 13-digit EAN-13 barcode with valid check digit
 * Uses in-store salon prefix '290' followed by numeric invoice sequence
 */
export function calculateEan13(invoiceSeqOrNum: string | number): string {
    // Extract only digits from invoice number (e.g. "CM-INV-1002" -> "1002")
    const digits = String(invoiceSeqOrNum).replace(/\D/g, '') || '1'
    // Format 12 data digits: prefix '290' + zero-padded invoice digits
    const padded = ('290' + digits.padStart(9, '0')).slice(0, 12)

    // Calculate EAN-13 check digit
    let sum = 0
    for (let i = 0; i < 12; i++) {
        const d = parseInt(padded[i], 10)
        sum += i % 2 === 0 ? d * 1 : d * 3
    }
    const checkDigit = (10 - (sum % 10)) % 10
    return padded + checkDigit
}

export interface SeznikPrintOptions {
    branchAddress?: string
    branchPhone?: string
    gstin?: string
    upiVpa?: string
    showUpiQr?: boolean
    showEan13?: boolean
    customFooterNote?: string
}

/**
 * Generates the complete 32-character monospace plain text receipt
 * formatted specifically for SEZNIK Veer (MPT-II 58mm) printers.
 */
export function generate32ColReceiptText(invoice: Invoice, opts: SeznikPrintOptions = {}): string {
    const lines: string[] = []
    const eq = '='.repeat(SEZNIK_LINE_WIDTH)
    const dash = '-'.repeat(SEZNIK_LINE_WIDTH)

    // Header
    lines.push(eq)
    lines.push(centerText('CHRISTALIN MIRRORS'))
    lines.push(centerText('HAIR & BEAUTY SALON'))
    lines.push(eq)

    // Branch Details
    if (invoice.branch) {
        lines.push(centerText(`Branch: ${invoice.branch}`))
    }
    if (opts.branchAddress) {
        const addrLines = wrapText(opts.branchAddress, SEZNIK_LINE_WIDTH)
        addrLines.forEach(l => lines.push(centerText(l)))
    }
    if (opts.branchPhone) {
        lines.push(centerText(`Ph: ${opts.branchPhone}`))
    }
    const gstin = opts.gstin || '29AAVFC4475G1ZU'
    lines.push(centerText(`GSTIN: ${gstin}`))
    lines.push(dash)

    // Invoice Meta
    lines.push(justifyTwo(`Inv: ${invoice.invoiceNumber}`, new Date(invoice.date + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })))
    if (invoice.clientName) {
        lines.push(justifyTwo(`Client: ${invoice.clientName}`, invoice.clientPhone || ''))
    }
    if (invoice.stylist) {
        lines.push(justifyTwo(`Stylist: ${invoice.stylist}`, invoice.status ? invoice.status.toUpperCase() : 'PAID'))
    }
    lines.push(dash)

    // Itemized Table Header (Font A: 32 columns)
    lines.push(justifyTwo('Item / Service', 'Amount (Rs.)'))
    lines.push(dash)

    // Items
    invoice.items.forEach(item => {
        if (!item.service) return
        const nameLines = wrapText(item.service, SEZNIK_LINE_WIDTH)
        nameLines.forEach(nl => lines.push(nl))

        const qtyRate = `  ${item.quantity} x ${formatRs(item.unitPrice)}`
        const itemTotal = formatRs(item.total)
        lines.push(justifyTwo(qtyRate, itemTotal))
    })
    lines.push(dash)

    // Financial Totals
    lines.push(justifyTwo('Subtotal:', formatRs(invoice.subtotal)))
    if (invoice.discountAmount > 0) {
        const discLabel = invoice.discountPercent > 0 ? `Discount (${invoice.discountPercent}%):` : 'Discount:'
        lines.push(justifyTwo(discLabel, `-${formatRs(invoice.discountAmount)}`))
    }
    if (invoice.taxAmount > 0) {
        const halfTax = invoice.taxPercent > 0 ? (invoice.taxPercent / 2).toFixed(1) : '2.5'
        lines.push(justifyTwo(`CGST (${halfTax}%):`, formatRs(Math.floor(invoice.taxAmount / 2))))
        lines.push(justifyTwo(`SGST (${halfTax}%):`, formatRs(invoice.taxAmount - Math.floor(invoice.taxAmount / 2))))
    }
    lines.push(dash)

    // Grand Total (Emphasized)
    lines.push(justifyTwo('GRAND TOTAL:', formatRs(invoice.total)))
    lines.push(eq)

    // Payment Info
    const payMethod = (invoice.paymentMethod || 'CASH').toUpperCase()
    lines.push(justifyTwo('Payment Mode:', payMethod))
    if (invoice.amountPaid > 0) {
        lines.push(justifyTwo('Amount Paid:', formatRs(invoice.amountPaid)))
    }
    const balance = invoice.total - invoice.amountPaid
    if (balance > 0) {
        lines.push(justifyTwo('Balance Due:', formatRs(balance)))
    } else if (invoice.amountPaid > invoice.total) {
        lines.push(justifyTwo('Change Returned:', formatRs(invoice.amountPaid - invoice.total)))
    }

    if (invoice.notes) {
        lines.push(dash)
        lines.push(toCp437Ascii(`Note: ${invoice.notes}`))
    }

    // Footer Messages
    lines.push(dash)
    lines.push(centerText('THANK YOU FOR YOUR VISIT!'))
    lines.push(centerText('CHRISTALIN MIRRORS'))
    if (opts.customFooterNote) {
        lines.push(centerText(opts.customFooterNote))
    } else {
        lines.push(centerText('Goods & Services once booked'))
        lines.push(centerText('are non-refundable'))
    }

    // Barcode & QR Code References
    const ean13 = calculateEan13(invoice.invoiceNumber)
    lines.push(dash)
    lines.push(centerText(`EAN13: ${ean13}`))
    lines.push(centerText(`[SEZNIK Veer 58mm Thermal]`))
    lines.push(eq)

    return lines.join('\n')
}

/**
 * Generate standard UPI dynamic payment string for Indian QR codes
 * e.g. upi://pay?pa=...&pn=Christalin+Mirrors&am=...&cu=INR&tn=...
 */
export function generateUpiPaymentString(invoice: Invoice, vpa = 'christalinmirrors@okaxis'): string {
    const payeeName = 'Christalin Mirrors'
    const note = `Invoice ${invoice.invoiceNumber}`
    const amount = (invoice.total || 0).toFixed(2)
    return `upi://pay?pa=${encodeURIComponent(vpa)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(note)}`
}

/**
 * Convert 32-character text into raw ESC/POS byte command stream for SEZNIK Veer (MPT-II)
 * Includes ESC @ (Init), ESC t 0 (CP437 codepage), ESC ! (Font A), line feeds and cut command.
 */
export function generateEscPosBytes(text: string, cut = true): Uint8Array {
    const encoder = new TextEncoder()
    const bytes: number[] = [
        0x1B, 0x40,             // ESC @: Initialize printer
        0x1B, 0x74, 0x00,       // ESC t 0: Select Character Code Table CP437
        0x1B, 0x21, 0x00,       // ESC ! 0: Select Font A (12x24 dots, standard 32 cols on 58mm)
        0x1B, 0x33, 0x1E,       // ESC 3 30: Line spacing 30 dots
    ]

    // Convert string lines into bytes
    const textBytes = encoder.encode(text)
    for (let i = 0; i < textBytes.length; i++) {
        bytes.push(textBytes[i])
    }

    // Feed lines so paper clears the thermal printhead & tear bar
    bytes.push(0x0A, 0x0A, 0x0A, 0x0A)

    if (cut) {
        // Partial / full cut command supported by MPT-II / SEZNIK Veer cutter models
        bytes.push(0x1D, 0x56, 0x41, 0x10)
    }

    return new Uint8Array(bytes)
}

/**
 * Direct Web Bluetooth Print to SEZNIK Veer / MPT-II thermal printer
 * Works directly in Chrome / Edge / Opera on Android, PC, and Mac without print dialogs!
 */
export async function printDirectWebBluetooth(rawBytes: Uint8Array): Promise<{ success: boolean; message: string }> {
    if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
        return {
            success: false,
            message: 'Web Bluetooth is not supported in this browser. Please use the Thermal Print dialog or Chrome on Android.',
        }
    }

    try {
        // Request any Bluetooth device with standard printer services or matching SEZNIK Veer / MPT-II names
        const device = await (navigator as any).bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: [
                '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS Bluetooth service
                'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // MPT-II / SEZNIK Veer service UUID
                '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent UART
                '0000e0ff-0000-1000-8000-00805f9b34fb',
            ],
        })

        if (!device || !device.gatt) {
            return { success: false, message: 'No Bluetooth device selected.' }
        }

        const server = await device.gatt.connect()
        // Find writable characteristic
        const services = await server.getPrimaryServices()
        let writeChar: any = null

        for (const service of services) {
            try {
                const chars = await service.getCharacteristics()
                for (const char of chars) {
                    if (char.properties.write || char.properties.writeWithoutResponse) {
                        writeChar = char
                        break
                    }
                }
            } catch (_) {}
            if (writeChar) break
        }

        if (!writeChar) {
            return { success: false, message: 'Could not find a writable thermal print channel on SEZNIK Veer.' }
        }

        // Send data in 20-512 byte chunks (standard BLE MTU)
        const CHUNK_SIZE = 100
        for (let i = 0; i < rawBytes.length; i += CHUNK_SIZE) {
            const chunk = rawBytes.slice(i, i + CHUNK_SIZE)
            if (writeChar.writeValueWithoutResponse) {
                await writeChar.writeValueWithoutResponse(chunk)
            } else {
                await writeChar.writeValue(chunk)
            }
            // Small throttle to avoid thermal buffer overrun
            await new Promise(r => setTimeout(r, 20))
        }

        return { success: true, message: `Successfully sent bill to SEZNIK Veer (${device.name || 'Printer'})!` }
    } catch (err: any) {
        if (err.name === 'NotFoundError' || err.message?.includes('User cancelled')) {
            return { success: false, message: 'Bluetooth pairing was cancelled.' }
        }
        return { success: false, message: `Bluetooth print failed: ${err.message || err}` }
    }
}
