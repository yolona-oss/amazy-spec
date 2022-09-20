import * as ethers from 'ethers'

let mnem = process.argv.splice(2).join(" ");
console.log(mnem)
let mnemWallet = ethers.Wallet.fromMnemonic(mnem)
console.log("public:", mnemWallet.publicKey, "\nprivate:", mnemWallet.privateKey)

