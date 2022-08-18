import axios from 'axios'
import { MarketSearchParams, MarketSearchRes } from "./../Types/Market.js"
import * as bnb from "@binance-chain/javascript-sdk"
import _web3 from 'web3'
const bnbClient = new bnb.BncClient("https://bnbapi.net/api")

const bsc_rpc = "https://bsc-dataseed.binance.org/"
const web3 = new _web3(
        new _web3.providers.HttpProvider(bsc_rpc)
)
const amazy_contract_address = web3.utils.toChecksumAddress('0x70624F31d403b5a5505b9127663674fc1195C383')
const method_buy = '0xd96a094a'

export class MarketApi {
        private contract?: string

        constructor(private api_url: URL = new URL("https://rest.amazy.io/marketplace")) {

        }

        connectedWallet() {
                return bnbClient.getPrivateKey()
        }

        async initBnb(contractAddress: string, privateKey?: string) {
                this.contract = contractAddress
                bnbClient.chooseNetwork("mainnet")
                if (privateKey) bnbClient.setPrivateKey(privateKey)
                await bnbClient.initChain()
        }

        async setWallet(privateKey: string): Promise<boolean> {
                try {
                        web3.eth.accounts.privateKeyToAccount(privateKey)
                } catch(e) {
                        return false
                }
                return true
        }


        // async createSellOrder(asset: number, price: number): Promise<boolean> {
        //         const hex_sale_id = asset.toString(16).slice(2)
        //         let order_data = `${method_buy}${hex_sale_id}`
        //         return true
        // }

        async createBuyOrder(asset: number) {
                const hex_sale_id = asset.toString(16).slice(2)
                let order_data = `${method_buy}${hex_sale_id}`

                return true
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
                const param: MarketSearchParams = {
                        ...defaulted,
                        ..._param
                }
                let res
                try {
                        res = await axios.get(this.api_url.toString(), {
                                data: param
                        })
                } catch (e) {
                        throw "Cannot get data from: " + this.api_url + "\n" + e
                }
                if (res.status != 200) {
                        throw "Cannot get data from: " + this.api_url
                }
                return res.data
        }
}
