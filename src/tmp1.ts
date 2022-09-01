import * as ethers from 'ethers'

let mnem = 'spin organ amused law method hope always seat circle recipe convince decrease';
let mnemWallet = ethers.Wallet.fromMnemonic(mnem)
console.log("public:", mnemWallet.publicKey, "\nprivate:", mnemWallet.privateKey)
