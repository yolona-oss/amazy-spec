import cfg from './Config.js'
import { MarketItem } from './Types/Market.js'
import { Sneakers } from './Types/Sneakers.js'
import { Box } from './Types/Box.js'
import { EventEmitter } from 'events'
import { MarketWatcher } from './Market/watcher.js'
import { MarketApi } from './Market/api.js'
import { log } from './lib/logger/index.js'

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
                log.echo("Initializing marketplace bot")
                if (cfg.wallet.publicKey.trim() != "" || cfg.wallet.privateKey.trim() != "") {
                        await this.azyApi.setWallet(
                                cfg.wallet.publicKey,
                                cfg.wallet.privateKey
                        )
                } else {
                        this.disableAutoBuy()
                        log.echo("No wallet specified. Notify only mode active now")
                }

                log.echo("Starting watcher")
                this.watcher.start()
        }

        async Dispose() {
                if (!this.watcher.Terminated) {
                        await this.watcher.stop()
                }
        }

        private async marketItemInfoGen(item: MarketItem) {
                let ret = "price wei: " + item.price +
                        "\nprice eth: " + item.priceEth
                if (item.type == "box") {
                        try {
                                ret += "\nmint1: type: " + (await this.azyApi.getItemDetails(item.parents[0])).primaryProperties.Type
                        } catch (e) { }
                        try {
                                ret += "\nmint2: type: " + (await this.azyApi.getItemDetails(item.parents[1])).primaryProperties.Type
                        } catch (e) { }
                } else {
                        ret += "\nstats(base): "
                        ret += JSON.stringify((<Sneakers>item).baseProperties, null, '\t')
                        ret += "\ncondition: " + (<Sneakers>item).primaryProperties.Condition
                }
                ret += "\nis genesis: " + item.genesis
                return ret
        }

        enableAutoBuy() {
                this.buyFn = async (i) => {
                        this.emit("buy",
                                  "Buying item: https://go.amazy.io/item/"+i.tokenId +
                                  await this.marketItemInfoGen(i)
                         )
                         try {
                                 await this.azyApi.createBuyOrder(i.sellId)
                                 log.echo("Transaction completed successfully")
                         } catch (e) {
                                 log.error(e)
                         }
                         return true
                }
        }

        disableAutoBuy() {
                this.buyFn = async (i) => {
                        this.emit("buy",
                                  "Notify. Found suitable item: https://go.amazy.io/item/"+i.tokenId +
                                  await this.marketItemInfoGen(i)
                         )
                        return true 
                }
        }

        get isAutoBuyEnabled() {
                return this.autoBuy
        }
}
