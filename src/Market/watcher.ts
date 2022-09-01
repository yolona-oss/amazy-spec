import { EventEmitter } from 'events'
import { MarketWatcherOpts, Watcher } from './../Types/Watcher.js'
import { AnalizerInterface, analizers } from './analizer.js'
import { sleep } from './../lib/time.js'
import { log } from './../lib/logger/index.js'

const defaultMarketWatcherOpts = {
        autoSell: false,
        autoBuy: false,
        argession: 0.5,
        freq: 1
}

export class MarketWatcher extends EventEmitter implements Watcher {
        private terminated: boolean
        private sleepTime: number
        private notifiedItems: number[]

        constructor(
                private opts: MarketWatcherOpts = defaultMarketWatcherOpts,
                private analizer: AnalizerInterface = new analizers.floor()
        ) {
                super()
                this.notifiedItems = new Array()
                this.terminated = true
                this.sleepTime = 1000/this.opts.freq 
        }

        private async updateState(f: Function) {
                let restart = false
                if (!this.terminated) {
                        await this.stop()
                        restart = true
                }
                f()
                if (restart) {
                        this.start()
                }
        }

        get CurrentAnalizer() {
                return this.analizer.name;
        }

        get Settings() {
                return this.opts
        }

        get Terminated() {
                return this.terminated
        }

        async changeAnalizer(analizer: AnalizerInterface) {
                await this.updateState(() => this.analizer = analizer)
        }

        async setFreq(hz: number) {
                await this.updateState(() => { this.opts.freq = hz })
        }

        async setAutoBuy(buy: boolean, sell: boolean) {
                await this.updateState(() => {
                        this.opts.autoBuy = buy
                        this.opts.autoSell = sell
                })
        }

        start() {
                if (!this.terminated) {
                        throw "Restarting watcher error"
                }
                this.terminated = false
                this.watch()
        }

        private async watch() {
                const iter_start = new Date().getTime()
                try {
                        const analized = await this.analizer.analize()
                        for (const nft of analized) {
                                if (
                                        nft.score >= this.opts.argession &&
                                        !this.notifiedItems.includes(nft.item.tokenId)
                                ) {
                                        this.notifiedItems.push(nft.item.tokenId)
                                        this.emit("buy", nft.item)
                                }
                        }
                } catch (e) {
                        log.error("Cannot analize:", e)
                }

                // parse solded nfts and send nodity to tg

                if (this.terminated) {
                        this.emit("terminated")
                        return
                } else {
                        const elapced = new Date().getTime() - iter_start
                        if (this.sleepTime - elapced > 0) {
                                await sleep(this.sleepTime - elapced)
                        }
                        await this.watch()
                }
        }

        stop() {
                if (this.terminated) {
                        throw "Terminating already terminated wather"
                }
                this.terminated = true
                return new Promise(async resolve => {
                        this.on("terminated", () => resolve)
                })
        }

}
