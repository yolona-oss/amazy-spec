import axios from 'axios'
import * as crypto from 'crypto'
import cheerio from 'cheerio'
import { MarketItem, MarketSearchParams, MarketSearchRes } from "./../Types/Market.js"
import { Sneakers } from './../Types/Sneakers.js'
import _web3 from 'web3'
import * as qs from 'qs'
import * as fs from 'fs'

const bsc_rpc = "https://bsc-dataseed.binance.org/"
const web3 = new _web3(
        new _web3.providers.HttpProvider(bsc_rpc)
)
const amazy_contract_address = web3.utils.toChecksumAddress('0x70624F31d403b5a5505b9127663674fc1195C383')
const method_buy = '0xd96a094a'

export class MarketApi {
        private contract?: string
        private wallet?: {
                publicKey: string
                privateKey: string
        }

        constructor(private api_url: URL = new URL("https://rest.amazy.io/marketplace")) {

        }

        connectedWallet() {
                return this.wallet
        }

        async setWallet(publicKey: string, privateKey: string): Promise<boolean> {
                try {
                        web3.eth.accounts.privateKeyToAccount(privateKey)
                } catch(e) {
                        return false
                }

                this.wallet = {
                        privateKey: privateKey,
                        publicKey: publicKey
                }
                return true
        }


        // async createSellOrder(asset: number, price: number): Promise<boolean> {
        // }

        async createBuyOrder(asset: number) {
                if (!this.wallet) {
                        throw "No wallet connected"
                }

                const hex_sale_id = asset.toString(16)
                let order_data = method_buy + hex_sale_id
                if (order_data.length < 74) {
                        order_data = method_buy + '0'.repeat(74-method_buy.length) + hex_sale_id
                }

                const raw_transaction = {
                        "from": this.wallet.publicKey,
                        "to": amazy_contract_address,
                        "nonce": web3.eth.getTransactionCount(this.wallet.publicKey),
                        "gas": 42000,
                        "gasPrice": web3.utils.toWei('8', 'gwei'),
                        "chainId": 56,
                        "data": order_data
                }

                const signed_tx = web3.eth.accounts.sign(JSON.stringify(raw_transaction), this.wallet.privateKey)
                // @ts-ignore
                const tx_res = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction)

                return tx_res
        }

        async fetchNFT(_param: Partial<MarketSearchParams>): Promise<MarketSearchRes> {
                const defaulted = {
                        levelMax: 0,
                        levelMin: 0,
                        mintMax:  0,
                        mintMin:  0,
                        page:     0,
                        perPage:  0,
                        type:     "box",
                        rarity:   "common",
                        valueMax: 0,
                        valueMin: 0,
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
                        console.log(e)
                        throw "Cannot get data from: " + this.api_url + "\n" + e
                }
                if (res.status != 200) {
                        console.log(res.statusText)
                        throw "Cannot get data from: " + this.api_url
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
