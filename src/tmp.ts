import { MarketApi, amazyGuru as guru } from './Market/api.js'
import { Sneakers } from './Types/Sneakers.js'

let api = new MarketApi()

const baseFetchOpts = {
        type: "sneakers",
        sorting: "Price ascending",
        sneakersType: [
                'hiker',
                'coacher'
        ],
        mintMax: 0,
        levelMax: 0,
        page: 1,
        perPage: 3,
}

let sneaks = (await api.fetchNFT({
        ...baseFetchOpts,
        rarity: "common"
})).sales

console.log("Sneak: " + sneaks[0].tokenId)
console.log("Real price: " + sneaks[0].price/1000000000000000000)
try {
        let price = await guru.predirectPrice(<Sneakers>sneaks[0])
        console.log("Pred price: " + price)
} catch(e) {
        console.error(e)
}
try {
        let income = await guru.fetchIncome(<Sneakers>sneaks[0])
        console.log("Daily income amt: " + income)
} catch(e) {
        console.error(e)
}

