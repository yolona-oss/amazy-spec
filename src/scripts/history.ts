import _web3 from 'web3'
import ethers from 'ethers'
import scan from '@jpmonette/bscscan'
import * as plotlib from 'nodeplotlib'

const bsc_scan_key = "REHPXJJA6BQN9IFZHFF51JPXKX97NNVXH1"
const bsc_scan_endpoint = "https://api.bscscan.com/"

const scanApi = new scan.BscScan({
        apikey: bsc_scan_key
})


const bsc_rpc = "https://bsc-dataseed.binance.org/"
const web3 = new _web3(
        new _web3.providers.HttpProvider(bsc_rpc)
)
const amazy_contract_address = web3.utils.toChecksumAddress('0x70624F31d403b5a5505b9127663674fc1195C383')
const methods = {
        buy:    "0xd96a094a",
        sell:   "0x6a272462",
        clance: "0x40e58ee5"
}

async function extractTransactions() {
        let transfers = await scanApi.accounts.getTxList({
                address: amazy_contract_address
        })

        interface marketItemInfo {
                tokenId: string
                timestamp: number
                price: string
        }

        let buys: marketItemInfo[] = [ ]
        let sells: marketItemInfo[] = [ ]

        for (const tx of transfers) {
                // @ts-ignore
                const method = tx["methodId"]

                const toJSTime = (ms: number) => ms * 1000
                const extractTokenId = (input: string, method: string) => input.slice(method.length).replace(/\b0+/g, '')

                if (tx.isError == "0") {
                        continue
                }

                switch (method) {
                        case methods.buy:
                        case methods.sell:
                                let store = buys
                                if (method == methods.sell) {
                                        store = sells
                                }
                                store.push({
                                        tokenId: extractTokenId(tx.input, method.buy),
                                        timestamp: toJSTime(Number(tx.timeStamp.toString())),
                                        price: tx.value,
                                })
                                break;
                        case methods.clance:
                                // TODO remove from arr storage
                                break;
                }
        }

        return {
                sells,
                buys
        }
}


async function main() {
        let marketInfo = await extractTransactions()
}

await main()
