import axios from 'axios'
import { MarketItem } from './../Types/Market.js'
import { Sneakers } from './../Types/Sneakers.js'
import { Box } from './../Types/Box.js'
import { MarketApi } from './api.js'

export interface AnalizerInterface {
        name: string
        boxAnalizer(item: Box, other: Box[]): number
        sneakersAnalizer(item: Sneakers, other: Sneakers[]): number
        analize(): Promise<{item: MarketItem, score: number}[]>
}

function toBnb(n: number) {
        return n/1000000000000000000
}

class FloorAnalizer implements AnalizerInterface {
        constructor(private api: MarketApi = new MarketApi()) {
        }

        name = "floor"

        boxAnalizer() { return 0 }

        sneakersAnalizer(item: Sneakers, other: Sneakers[]) {
                let avg = (arr: any[]) => arr.reduce((a,b) => a + b, 0) / arr.length
                let full = other.concat(item)
                const floor = avg(full.map(v => toBnb(v.price)))

                console.log(full.map(v => toBnb(v.price)))

                const max = Math.max(floor, toBnb(item.price))
                const min = Math.min(floor, toBnb(item.price))
                const diff = (max/min - 1) * 100
                console.log(new Date().toString())
                console.log("floor:", floor)
                console.log("id:", item.tokenId)
                console.log("rarity:", item.primaryProperties.Rarity)
                console.log("price:", toBnb(item.price))
                console.log("diff:", diff)
                console.log("stats:", item.baseProperties)
                console.log()

                if (
                        item.primaryProperties.Performance > 8.5 &&
                        toBnb(item.price) <= 0.9
                ) {
                        // const max = Math.max(floor, toBnb(item.price))
                        // const min = Math.min(floor, toBnb(item.price))
                        // const diff = (max/min - 1) * 100

                        if (floor == max && diff > 5) {
                                return 1
                        }
                }

                return 0
        }

        async analize() {
                let items = new Array()

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

                const sneakers = {
                        common: (await this.api.fetchNFT({
                                ...baseFetchOpts,
                                rarity: "common"
                        })).sales,
                        uncommon: (await this.api.fetchNFT({
                                ...baseFetchOpts,
                                rarity: "uncommon"
                        })).sales,
                        rare: (await this.api.fetchNFT({
                                ...baseFetchOpts,
                                rarity: "rare"
                        })).sales,
                }

                Object.values(sneakers).forEach((collection) => {
                        if (collection.length == 3) {
                                collection.forEach((i) =>
                                        items.push({
                                                item: i,
                                                score: (this.sneakersAnalizer(<Sneakers>i,
                                                        <Sneakers[]>collection.filter(v => v.tokenId != i.tokenId)
                                                ))
                                        })
                                )
                        }
                })

                return items
        }
}

class SmartAnalizer implements AnalizerInterface {
        private _curStepItems: {item: MarketItem, score: number}[]

        constructor(private api: MarketApi = new MarketApi()) {
                this._curStepItems = new Array()
        }

        name = "smart"

        boxAnalizer() { return 0 }

        sneakersAnalizer(item: MarketItem) {
                item
                const sneak = {

                }
                return 1
        }

        async analize() {
                this._curStepItems = new Array()

                const sneakers = (await this.api.fetchNFT({
                        type: "sneakers"
                })).sales

                for (const i of sneakers) {
                        this._curStepItems.push({
                                item: i,
                                score: this.sneakersAnalizer(i)
                        })
                }

                return this._curStepItems
        }
}

export const analizers = {
        floor: FloorAnalizer,
        smart: SmartAnalizer
}
