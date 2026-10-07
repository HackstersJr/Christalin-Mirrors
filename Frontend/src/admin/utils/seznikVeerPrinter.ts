/**
 * SEZNIK Veer (MPT-II Compatible) 58mm Thermal Printer Engine
 * ──────────────────────────────────────────────────────────────────
 * Specifications & Constraints:
 * - Printer Model: SEZNIK Veer (MPT-II compatible, 58mm / 2-inch roll width)
 * - Printable character width: Exactly 32 characters per line (Font A: 12x24)
 * - Codepage: CP437 (Standard ASCII / Western European)
 * - Web Bluetooth: Uses @point-of-sale/webbluetooth-receipt-printer & @point-of-sale/receipt-printer-encoder
 */

import WebBluetoothReceiptPrinter from '@point-of-sale/webbluetooth-receipt-printer'
import ReceiptPrinterEncoder from '@point-of-sale/receipt-printer-encoder'
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
        .replace(/[^\x20-\x7E\r\n\t]/g, '')
}

/**
 * Format currency amount for CP437 (using "Rs." prefix without Unicode rupee symbol)
 */
export function formatRs(amount: number): string {
    const fixed = Math.round(amount * 100) / 100
    const str = fixed % 1 === 0 ? fixed.toLocaleString('en-IN') : fixed.toFixed(2)
    return `Rs.${str}`
}

export function formatRsAmountOnly(amount: number): string {
    const fixed = Math.round(amount * 100) / 100
    return fixed % 1 === 0 ? fixed.toLocaleString('en-IN') : fixed.toFixed(2)
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
 * Calculate standard 13-digit EAN-13 barcode with valid check digit
 * Uses in-store salon prefix '290' followed by numeric invoice sequence
 */
export function calculateEan13(invoiceSeqOrNum: string | number): string {
    const digits = String(invoiceSeqOrNum).replace(/\D/g, '') || '1'
    const padded = ('290' + digits.padStart(9, '0')).slice(0, 12)

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
 * Build binary ESC/POS stream using @point-of-sale/receipt-printer-encoder
 * Configured specifically for SEZNIK Veer (MPT-II compatible 58mm / 32 cols Font A)
 */
export function encodeInvoiceReceipt(invoice: Invoice, opts: SeznikPrintOptions = {}): Uint8Array {
    const encoder = new ReceiptPrinterEncoder({
        language: 'esc-pos',
        columns: 32,                 // 32 characters per line for 58mm / 2-inch roll
        codepageMapping: 'epson',    // Standard CP437 mapping
        printerModel: 'mpt-ii',
    })

    const eq = '================================'
    const dash = '--------------------------------'
    const dateStr = new Date(invoice.date + 'T00:00:00').toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
    })

    encoder
        .initialize()
        .align('center')
        .bold(true)
        .line('CHRISTALIN MIRRORS')
        .bold(false)
        .line('HAIR & BEAUTY SALON')
        .line(eq)
        .align('center')

    if (invoice.branch) {
        encoder.line(`Branch: ${toCp437Ascii(invoice.branch)}`)
    }
    if (opts.branchAddress) {
        wrapText(opts.branchAddress, 32).forEach(l => encoder.line(l))
    }
    if (opts.branchPhone) {
        encoder.line(`Ph: ${opts.branchPhone}`)
    }
    encoder
        .line(`GSTIN: ${opts.gstin || '29AAVFC4475G1ZU'}`)
        .line(dash)
        .align('left')
        .line(justifyTwo(`Inv: ${invoice.invoiceNumber}`, dateStr, 32))

    if (invoice.clientName) {
        encoder.line(justifyTwo(`Client: ${invoice.clientName}`, invoice.clientPhone || '', 32))
    }
    if (invoice.stylist) {
        encoder.line(justifyTwo(`Stylist: ${invoice.stylist}`, (invoice.status || 'PAID').toUpperCase(), 32))
    }

    encoder
        .line(dash)
        .align('left')

    // Item Table using 32-col layout: 18 chars (name), 4 chars (qty), 10 chars (amount)
    const itemRows: [string, string, string][] = []
    invoice.items.forEach(it => {
        if (!it.service) return
        itemRows.push([
            toCp437Ascii(it.service),
            String(it.quantity),
            formatRsAmountOnly(it.total),
        ])
    })

    if (itemRows.length > 0) {
        encoder
            .table(
                [
                    { width: 18, align: 'left' },
                    { width: 4, align: 'right' },
                    { width: 10, align: 'right' },
                ],
                [
                    ['Item', 'Qty', 'Amount'],
                    ...itemRows,
                ]
            )
    }

    encoder
        .line(dash)
        .align('left')
        .line(justifyTwo('Subtotal:', formatRs(invoice.subtotal), 32))

    if (invoice.discountAmount > 0) {
        const discLabel = invoice.discountPercent > 0 ? `Discount (${invoice.discountPercent}%):` : 'Discount:'
        encoder.line(justifyTwo(discLabel, `-${formatRs(invoice.discountAmount)}`, 32))
    }
    if (invoice.taxAmount > 0) {
        const halfTax = invoice.taxPercent > 0 ? (invoice.taxPercent / 2).toFixed(1) : '2.5'
        encoder.line(justifyTwo(`CGST (${halfTax}%):`, formatRs(Math.floor(invoice.taxAmount / 2)), 32))
        encoder.line(justifyTwo(`SGST (${halfTax}%):`, formatRs(invoice.taxAmount - Math.floor(invoice.taxAmount / 2)), 32))
    }

    encoder
        .line(dash)
        .align('left')
        .bold(true)
        .line(justifyTwo('TOTAL:', formatRs(invoice.total), 32))
        .bold(false)
        .line(eq)

    // Payment Info
    const payMethod = (invoice.paymentMethod || 'CASH').toUpperCase()
    encoder.line(justifyTwo('Payment Mode:', payMethod, 32))
    if (invoice.amountPaid > 0) {
        encoder.line(justifyTwo('Amount Paid:', formatRs(invoice.amountPaid), 32))
    }
    const balance = invoice.total - invoice.amountPaid
    if (balance > 0) {
        encoder.line(justifyTwo('Balance Due:', formatRs(balance), 32))
    } else if (invoice.amountPaid > invoice.total) {
        encoder.line(justifyTwo('Change Returned:', formatRs(invoice.amountPaid - invoice.total), 32))
    }

    if (invoice.notes) {
        encoder
            .line(dash)
            .line(`Note: ${toCp437Ascii(invoice.notes)}`)
    }

    // Dynamic UPI QR Code
    if (opts.showUpiQr !== false) {
        const upiString = generateUpiPaymentString(invoice, opts.upiVpa)
        encoder
            .line(dash)
            .align('center')
            .qrcode(upiString, 1, 6, 'm')
            .newline()
            .line('Scan to Pay via UPI')
    }

    // EAN-13 Barcode
    if (opts.showEan13 !== false) {
        const ean13 = calculateEan13(invoice.invoiceNumber)
        try {
            encoder
                .line(dash)
                .align('center')
                .barcode(ean13, 'ean13', 45)
                .newline()
        } catch (_) {
            encoder.line(`EAN13: ${ean13}`)
        }
    }

    encoder
        .align('center')
        .line(eq)
        .line('Thank you! Visit again.')
        .line('Team Christalin Mirrors')
        .newline()
        .newline()
        .newline() // Feeds past tear bar (58mm portable printers lack auto-cutters)

    return encoder.encode()
}

/**
 * Print via Web Bluetooth using @point-of-sale/webbluetooth-receipt-printer
 * Triggers native browser Bluetooth device picker and transmits ESC/POS data.
 */
export async function printInvoiceViaBluetooth(
    invoice: Invoice,
    opts: SeznikPrintOptions = {}
): Promise<{ success: boolean; message: string }> {
    if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
        return {
            success: false,
            message: 'Web Bluetooth is not supported in this browser. Please use Google Chrome or Microsoft Edge on Android, Windows, Mac, or Linux.',
        }
    }

    try {
        // 1. Initialize Bluetooth Printer Manager
        const receiptPrinter = new WebBluetoothReceiptPrinter()

        // 2. Request and Connect (Must be triggered by user click/gesture)
        await receiptPrinter.connect()

        // 3. Build receipt layout using ReceiptPrinterEncoder
        const receiptData = encodeInvoiceReceipt(invoice, opts)

        // 4. Send byte stream to SEZNIK Veer printer
        await receiptPrinter.print(receiptData)

        // 5. Disconnect when finished
        await receiptPrinter.disconnect()

        return {
            success: true,
            message: 'Printed successfully via Web Bluetooth to SEZNIK Veer!',
        }
    } catch (err: any) {
        if (err.name === 'NotFoundError' || err.message?.includes('User cancelled')) {
            return {
                success: false,
                message: 'Bluetooth device selection was cancelled.',
            }
        }
        return {
            success: false,
            message: `Bluetooth printing error: ${err.message || err}`,
        }
    }
}

/**
 * Generates the 32-character monospace plain text receipt string
 * (Used for on-screen preview, copy-to-clipboard, and browser @page print)
 */
export function generate32ColReceiptText(invoice: Invoice, opts: SeznikPrintOptions = {}): string {
    const lines: string[] = []
    const eq = '='.repeat(SEZNIK_LINE_WIDTH)
    const dash = '-'.repeat(SEZNIK_LINE_WIDTH)

    lines.push(eq)
    lines.push(centerText('CHRISTALIN MIRRORS'))
    lines.push(centerText('HAIR & BEAUTY SALON'))
    lines.push(eq)

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

    const dateStr = new Date(invoice.date + 'T00:00:00').toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
    })
    lines.push(justifyTwo(`Inv: ${invoice.invoiceNumber}`, dateStr))
    if (invoice.clientName) {
        lines.push(justifyTwo(`Client: ${invoice.clientName}`, invoice.clientPhone || ''))
    }
    if (invoice.stylist) {
        lines.push(justifyTwo(`Stylist: ${invoice.stylist}`, invoice.status ? invoice.status.toUpperCase() : 'PAID'))
    }
    lines.push(dash)

    lines.push(justifyTwo('Item / Service', 'Amount (Rs)'))
    lines.push(dash)

    invoice.items.forEach(item => {
        if (!item.service) return
        const nameLines = wrapText(item.service, SEZNIK_LINE_WIDTH)
        nameLines.forEach(nl => lines.push(nl))

        const qtyRate = `  ${item.quantity} x ${formatRs(item.unitPrice)}`
        const itemTotal = formatRs(item.total)
        lines.push(justifyTwo(qtyRate, itemTotal))
    })
    lines.push(dash)

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

    lines.push(justifyTwo('GRAND TOTAL:', formatRs(invoice.total)))
    lines.push(eq)

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

    lines.push(dash)
    lines.push(centerText('THANK YOU FOR YOUR VISIT!'))
    lines.push(centerText('CHRISTALIN MIRRORS'))
    if (opts.customFooterNote) {
        lines.push(centerText(opts.customFooterNote))
    } else {
        lines.push(centerText('Goods & Services once booked'))
        lines.push(centerText('are non-refundable'))
    }

    const ean13 = calculateEan13(invoice.invoiceNumber)
    lines.push(dash)
    lines.push(centerText(`EAN13: ${ean13}`))
    lines.push(centerText(`[SEZNIK Veer 58mm Thermal]`))
    lines.push(eq)

    return lines.join('\n')
}
