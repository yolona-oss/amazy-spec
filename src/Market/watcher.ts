import { EventEmitter } from 'events'
import { MarketWatcherOpts, Watcher } from './../Types/Watcher.js'
import { AnalizerInterface, analizers } from './analizer.js'
import { sleep } from './../lib/time.js'
import { log } from './../lib/logger/index.js'

const defaultMarketWatcherOpts: MarketWatcherOpts = {
        argession: 0.5,
        freq: 1
}

export class MarketWatcher extends EventEmitter implements Watcher {
        private terminated: boolean
        private sleepTime: number
        private notifiedItems: number[]

        constructor(
                private opts?: MarketWatcherOpts,
                private analizer: AnalizerInterface = new analizers.static()
        ) {
                super()
                this.opts = {
                        ...defaultMarketWatcherOpts,
                        ...opts
                }
                this.notifiedItems = new Array()
                this.terminated = true
                // @ts-ignore
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
                await this.updateState(() => { this.opts!.freq = hz })
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
                                        nft.score >= this.opts!.argession &&
                                        !this.notifiedItems.includes(nft.item.sellId)
                                ) {
                                        this.notifiedItems.push(nft.item.sellId)
                                        this.emit("buy", nft.item)
                                }
                        }
                } catch (e) {
                        log.error("Cannot analize:", e)
                }

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
