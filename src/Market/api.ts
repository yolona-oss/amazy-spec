import axios from 'axios'
import cheerio from 'cheerio'
import { MarketSearchParams, MarketSearchRes } from "./../Types/Market.js"
import { Sneakers } from './../Types/Sneakers.js'
import { MarketItem } from './../Types/Market.js'
import _web3 from 'web3'
import * as qs from 'qs'
import * as fs from 'fs'
import Path from 'path'
import { log } from './../lib/logger/index.js'

const bsc_rpc = "https://bsc-dataseed.binance.org/"
log.echo("Connecting to bsc network")
const web3 = new _web3(
        new _web3.providers.HttpProvider(bsc_rpc)
)
const amazy_contract_address = web3.utils.toChecksumAddress('0x70624F31d403b5a5505b9127663674fc1195C383')
const abi = JSON.parse(
        fs.readFileSync(
                Path.join("abi", amazy_contract_address+".json")
        ).toString()
)

export class MarketApi {
        private wallet: {
                publicKey: string | null
                privateKey: string | null
        }
        private contract

        constructor(private api_url: URL = new URL("https://rest.amazy.io/marketplace")) {
                this.contract = new web3.eth.Contract(abi, amazy_contract_address)
                this.wallet = {
                        publicKey: null,
                        privateKey: null
                }
        }

        connectedWallet() {
                return this.wallet
        }

        async setWallet(publicKey: string, privateKey: string): Promise<boolean> {
                this.wallet = {
                        privateKey: privateKey,
                        publicKey: publicKey
                }
                web3.eth.accounts.wallet.add(privateKey)
                log.echo("Balance:", await web3.eth.getBalance(publicKey))
                return true
        }

        async getItemDetails(tokenId: number): Promise<MarketItem> {
                let ret = await axios.get("https://rest.amazy.io/item/" + tokenId)
                if (ret.status != 200) {
                        throw "Cannot fetch item details"
                } else {
                        return ret.data
                }
        }

        // async createSellOrder(asset: number, price: number): Promise<boolean> {
        // }

        async createBuyOrder(asset: number) {
                if (!this.wallet.publicKey || !this.wallet.privateKey) {
                        throw "No wallet connected"
                }

                log.echo("Buing", asset)

                const tx_res = await this.contract.methods.buy(asset).send({
                        from: this.wallet.publicKey,
                        gasPrice: await web3.eth.getGasPrice()
                })

                return tx_res
        }

        async fetchNFT(_param: Partial<MarketSearchParams>): Promise<MarketSearchRes> {
                let defaulted = {
                        levelMax: 0,
                        levelMin: 0,
                        mintMax:  0,
                        mintMin:  0,
                        page:     0,
                        perPage:  0,
                        type:     "sneakers",
                        rarity:   "common",
                        valueMax: 0,
                        valueMin: 0,
                }

                if (_param.type == "box") {
                        // @ts-ignore
                        delete defaulted.levelMax
                        // @ts-ignore
                        delete defaulted.levelMin
                        // @ts-ignore
                        delete defaulted.mintMax
                        // @ts-ignore
                        delete defaulted.mintMin

                        if (_param.levelMax) {
                                delete _param.levelMax
                        }

                        if (_param.levelMin) {
                                delete _param.levelMin
                        }

                        if (_param.sneakersType) {
                                delete _param.sneakersType
                        }

                        if (_param.mintMax) {
                                delete _param.mintMax
                        }

                        if (_param.mintMin) {
                                delete _param.mintMin
                        }
                }

                const params: MarketSearchParams = {
                        ...defaulted,
                        ..._param
                }
                let res
                try {
                        res = await axios.get(this.api_url.toString(), {
                                params,
                                paramsSerializer: params => {
                                        return qs.stringify(params, {arrayFormat: 'repeat', format: 'RFC1738'})
                                }
                        })
                } catch (e) {
                        log.error(e)
                        throw "Cannot get data from: " + this.api_url + "\n" + e
                }
                if (res.status != 200) {
                        log.error("Cannot get data from: " + this.api_url + " " + res.statusText)
                        throw "Cannot get data from: " + this.api_url + " " + res.statusText
                }
                return res.data
        }
}


const amazy_predirect_price_url = "https://prediction.amazy.guru/predict_Price"

export let amazyGuru = (() => {

        async function predirectPrice(sneakers: Sneakers) {
                let res
                try {
                        res = await axios.post(amazy_predirect_price_url, {
                                performance: sneakers.primaryProperties.Performance,
                                joy:         sneakers.primaryProperties.Joy,
                                fortune:     sneakers.primaryProperties.Fortune,
                                durability:  sneakers.primaryProperties.Durability,
                                genesis:     false,
                                lvl:         sneakers.level,
                                mints:       sneakers.primaryProperties.Mint,
                                rarity:      sneakers.primaryProperties.Rarity,
                                type:        sneakers.primaryProperties.Type,
                                params: {
                                        performance: sneakers.primaryProperties.Performance,
                                        joy:         sneakers.primaryProperties.Joy,
                                        fortune:     sneakers.primaryProperties.Fortune,
                                        durability:  sneakers.primaryProperties.Durability,
                                }
                        })
                } catch(e) {
                        throw "Cannot fetch: " + e
                }

                if (res.status != 200) {
                        throw "Cannot fetch: " + res.statusText
                }

                return res.data.predicted_Price
        }

        async function fetchIncome(sneakers: Sneakers, income_period: "per_day" = "per_day") {

                let res
                try {
                        res = await axios("https://amazy.guru/en", {
                                params: {
                                        energy:    30,
                                        level:     sneakers.level,
                                        perf:      sneakers.primaryProperties.Performance,
                                        perf_base: sneakers.baseProperties.Performance,
                                        for:       sneakers.primaryProperties.Fortune,
                                        for_base:  sneakers.baseProperties.Fortune,
                                        joy:       sneakers.primaryProperties.Joy,
                                        joy_base:  sneakers.baseProperties.Joy,
                                        dur:       sneakers.primaryProperties.Durability,
                                        dur_base:  sneakers.baseProperties.Durability,
                                        genesis:   "false",
                                        rarity:    sneakers.primaryProperties.Rarity.toLowerCase(),
                                        type:      sneakers.primaryProperties.Type.toLowerCase(),
                                        c_type:    "sprinter",
                                        mints:     sneakers.primaryProperties.Mint,
                                        promo:     "false",
                                        payback:   "",
                                        income_period: income_period,
                                }
                        })
                } catch (e) {
                        throw "Cannot fetch " + e
                }

                if (res.status != 200) {
                        throw "Cannot fetch " + res.statusText
                }

                fs.writeFileSync("/home/xewii/guru", res.data)

                let $ = cheerio.load(res.data)

                return $("div.row.row--center.row--left.CoinValue_value__WcUnT div.caption-lg.weight-normal").first().eq(0).text()
        }

        return {
                fetchIncome,
                predirectPrice
        }
})()
