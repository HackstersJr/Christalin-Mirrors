declare module '@point-of-sale/webbluetooth-receipt-printer' {
    export interface ConnectedPrinterInfo {
        type: 'bluetooth'
        name: string
        id: string
        language: string
        codepageMapping: string
        columns?: number
    }

    export default class WebBluetoothReceiptPrinter {
        constructor(options?: any)
        connect(): Promise<void>
        reconnect(device: { id: string }): Promise<void>
        disconnect(): Promise<void>
        print(data: Uint8Array | Uint8Array[] | ArrayBuffer): Promise<void>
        addEventListener(
            event: 'connected' | 'disconnected' | 'data',
            callback: (info?: ConnectedPrinterInfo | any) => void
        ): void
    }
}
