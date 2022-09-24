export interface Watcher {
        start(): void;
        stop(): void;
        setFreq(hz: number): void;
}

export interface WatcherOpts {
        freq: number
}

export interface MarketWatcherOpts extends WatcherOpts {
        argession: number
}
