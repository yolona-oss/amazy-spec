import axios from 'axios'
import { MarketSearchParams, MarketSearchRes } from "./../Types/Market.js"
import * as bnb from "@binance-chain/javascript-sdk"
const bnbClient = new bnb.BncClient("https://bnbapi.net/api")

export class MarketApi {
        private contract?: string

        // https://rest.amazy.io/marketplace/?levelMax=&levelMin=&mintMax=&mintMin=&page=1&perPage=12&type=sneakers&valueMax=&valueMin=
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
                        let res = await bnbClient.setPrivateKey(privateKey)
                        if (res.getPrivateKey()) {
                                return true
                        }
                } catch(e) {
                        return false
                }
                return false
        }


        // async createSellOrder(asset: number, price: number): Promise<boolean> {
        //         let tx = new bnb.Transaction({
        //                 data: {
        //                         _id: asset
        //                 }
        //         })
        //         bnbClient.sendTransaction(, true)
        //         return true
        // }

        async createBuyOrder(asset: number) {
                asset
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
