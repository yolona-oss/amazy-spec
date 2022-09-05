// import * as ethers from 'ethers'

// let mnem = 'spin organ amused law method hope always seat circle recipe convince decrease';
// let mnemWallet = ethers.Wallet.fromMnemonic(mnem)
// console.log("public:", mnemWallet.publicKey, "\nprivate:", mnemWallet.privateKey)

import _web3 from 'web3'

const bsc_rpc = "https://bsc-dataseed1.binance.org/"
const web3 = new _web3(
        new _web3.providers.HttpProvider(bsc_rpc)
)
const amazy_contract_address = web3.utils.toChecksumAddress('0x70624F31d403b5a5505b9127663674fc1195C383')
const method_buy = '0xd96a094a'
const asset = 123

const hex_sale_id = asset.toString(16)
let order_data = method_buy + hex_sale_id
if (order_data.length < 74) {
        order_data = method_buy + '0'.repeat(72-method_buy.length) + hex_sale_id
}

const wallet = {
        privateKey: "cb925b229c23cb91b82e4b09a8d5e7dac7168f441537d61206b671b9e06a6d0d",
        publicKey: "0xA6aB391aFaaD74F1398641734d72018163D16220"
}

console.log("order data:", order_data)

const tx = {
        "from": wallet.publicKey,
        "to": amazy_contract_address,
        "nonce": await web3.eth.getTransactionCount(wallet.publicKey),
        "gas": 41000,
        "gasPrice": web3.utils.toWei('10', 'gwei'),
        "chainId": 56,
        "data": order_data
}

let tx_res: any & { status: boolean }
try {
        let signed_tx = await web3.eth.accounts.signTransaction(tx, wallet.privateKey)
        console.log(signed_tx)
        if (signed_tx.rawTransaction) {
                tx_res = await web3.eth.sendSignedTransaction(signed_tx.rawTransaction)
                console.log(tx_res)
        } else {
                throw "No raw transaction after signing"
        }
} catch (e) {
        console.error(e)
}
