import cfg from './Config.js'
import { MarketItem } from './Types/Market.js'
import { EventEmitter } from 'events'
import { MarketWatcher } from './Market/watcher.js'
import { MarketApi } from './Market/api.js'

type buyFn_t = (i: MarketItem) => Promise<boolean>

export class Bot extends EventEmitter {
        public readonly azyApi
        public readonly watcher

        // @ts-ignore
        private buyFn: buyFn_t
        private autoBuy: boolean = cfg.watcher.autoBuy

        constructor() {
                super()

                this.azyApi = new MarketApi()
                this.watcher = new MarketWatcher({
                        freq: cfg.watcher.freqHz,
                        argession: 1
                })

                if (cfg.watcher.autoBuy) {
                        this.enableAutoBuy()
                } else {
                        this.disableAutoBuy()
                }

                this.watcher.on("buy", (i) => this.buyFn(i))
        }

        async init() {
                await this.azyApi.setWallet(
                        cfg.wallet.publicKey,
                        cfg.wallet.privateKey
                )

                this.watcher.start()
        }

        async Dispose() {
                if (!this.watcher.Terminated) {
                        await this.watcher.stop()
                }
        }

        enableAutoBuy() {
                this.buyFn = async (i) => {
                        this.emit("buy",
                                  "Buying item: https://go.amazy.io/item/"+i.tokenId +
                                  "\nprice bnb: " + i.price +
                                  "\nprice eth: " + i.priceEth
                         )
                         await this.azyApi.createBuyOrder(i.sellId)
                         return true
                }
        }

        disableAutoBuy() {
                this.buyFn = async (i) => {
                        this.emit("buy",
                                  "Notify. Found suitable item: https://go.amazy.io/item/"+i.tokenId +
                                  "\nprice bnb: " + i.price +
                                  "\nprice eth: " + i.priceEth
                         )
                        return true 
                }
        }

        get isAutoBuyEnabled() {
                return this.autoBuy
        }
}
