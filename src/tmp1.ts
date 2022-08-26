import * as ethers from 'ethers'

let mnem = 'quiz idea curve awkward tube whisper review cake guess need faith amazing';
let mnemWallet = ethers.Wallet.fromMnemonic(mnem)
console.log("public:", mnemWallet.publicKey, "\nprivate:", mnemWallet.privateKey)
