export interface Watcher {
        start(): void;
        stop(): void;
        setFreq(hz: number): void;
}

export interface WatcherOpts {
        freq: number
}

export interface MarketWatcherOpts extends WatcherOpts {
        wallet: {
                phrases: string[]
                keyPair: {
                        privateKey: string
                        publicKey: string
                }
        }
        autoSell: boolean
        autoBuy: boolean
        argession: number
}
