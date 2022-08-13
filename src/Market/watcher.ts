import { EventEmitter } from 'events'
import { MarketWatcherOpts, Watcher } from './../Types/Watcher.js'
import { AnalizerInterface } from './analizer.js'
import { sleep } from './../lib/time.js'

export class MarketWatcher extends EventEmitter implements Watcher {
        private terminated: boolean
        private sleepTime: number
        private onIteration: boolean

        constructor(private opts: MarketWatcherOpts, private analizer: AnalizerInterface) {
                super()
                this.terminated = true
                this.onIteration = false
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

        get Settings() {
                return this.opts
        }

        get Terminated() {
                return this.terminated
        }

        get Ready() {
                return (
                        this.opts.wallet.keyPair.privateKey && this.opts.wallet.keyPair.privateKey != ""
                )
        }

        async changeAnalizer(analizer: AnalizerInterface) {
                await this.updateState(() => this.analizer = analizer)
        }

        async setFreq(hz: number) {
                await this.updateState(() => { this.opts.freq = hz })
        }

        async setWallet(key: string) {
                await this.updateState(() => {
                        this.opts.wallet.keyPair.privateKey = key
                })
        }

        async setAutoBuy(buy: boolean, sell: boolean) {
                await this.updateState(() => {
                        this.opts.autoBuy = buy
                        this.opts.autoSell = sell
                })
        }

        async start() {
                if (!this.terminated) {
                        throw "Restarting watcher error"
                }
                if (!this.Ready) {
                        return false
                }
                this.terminated = false
                this.watch()
                return true
        }

        private async watch() {
                this.onIteration = true

                const analized = await this.analizer.analize()
                for (const nft of analized) {
                        if (nft.score > this.opts.argession) {
                                this.emit("buy", nft.item)
                        }
                }

                // parse solded nfts and send nodity to tg

                this.onIteration = false
                if (this.terminated) {
                        return
                } else {
                        await sleep(this.sleepTime)
                        await this.watch()
                }
        }

        async stop() {
                if (this.terminated) {
                        throw "Terminating already terminated wather"
                }
                this.terminated = true
                return new Promise(async resolve => {
                        while (this.onIteration) {
                                await sleep(100)
                        }
                        resolve
                })
        }

}
