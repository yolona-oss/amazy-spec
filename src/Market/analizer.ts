import axios from 'axios'
import { MarketItem } from './../Types/Market.js'
import { Sneakers } from './../Types/Sneakers.js'
import { Box } from './../Types/Box.js'
import { MarketApi } from './api.js'

export interface AnalizerInterface {
        name: string
        boxAnalizer(item: Box, other: Box[]): number
        sneakersAnalizer(item: Sneakers): number
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

        sneakersAnalizer(item: Sneakers) {
                const per_performance_price = (performance: number, base_performance: number, base_price: number, performance_slice: number, per_perf_mult: number) => {
                        if (performance > base_performance) {
                                const perf_diff = performance - base_performance
                                return base_price * ( perf_diff / performance_slice * per_perf_mult )
                        }

                        return base_price
                }

                interface AnalizeSettings {
                        type: string

                        min_performance: number

                        min_level?: number
                        max_level?: number
                        min_mint?: number
                        max_mint?: number

                        max_base_price: number
                        performance_grow_step: number
                        performance_grow_mult: number
                }

                const analize = (item: Sneakers, settings: AnalizeSettings) => {
                        if ((settings.type == "any" || item.primaryProperties.Type.toLowerCase() == settings.type.toLowerCase()) &&
                                        item.baseProperties.Performance >= settings.min_performance &&
                                        (settings.min_level ? item.level >= settings.min_level : true) && 
                                        (settings.max_level ? item.level <= settings.max_level : true) && 
                                        (settings.min_mint ? item.primaryProperties.Mint >= settings.min_mint : true) && 
                                        (settings.max_mint ? item.primaryProperties.Mint <= settings.max_mint : true) && 
                                        toBnb(item.price) <= (item.baseProperties.Performance > settings.min_performance ?
                                                settings.max_base_price + (item.baseProperties.Performance - settings.min_performance) /
                                                                           settings.performance_grow_step * settings.performance_grow_mult
                                                :
                                                settings.max_base_price)
                        ) {
                                return true
                        }
                        return false
                }

                const settings: AnalizeSettings[] = [
                        {
                                type: "Coacher",
                                max_mint: 0,
                                max_level: 0,
                                min_performance: 8.2,
                                max_base_price: 1,
                                performance_grow_step: 0.2,
                                performance_grow_mult: 0.01,
                        },
                        {
                                type: "Coacher",
                                max_mint: 0,
                                max_level: 0,
                                min_performance: 6.5,
                                max_base_price: 0.8,
                                performance_grow_step: 0.1,
                                performance_grow_mult: 0.01,
                        },
                        {
                                type: "Hiker",
                                max_mint: 0,
                                max_level: 0,
                                min_performance: 8.5,
                                max_base_price: 0.93,
                                performance_grow_step: 0.3,
                                performance_grow_mult: 0.01,
                        },

                        // instabuy

                        {
                                type: "any",
                                min_performance: 0,
                                max_base_price: 0.5,
                                performance_grow_step: 0.1,
                                performance_grow_mult: 0,
                        },
                        {
                                type: "Coacher",
                                min_performance: 0,
                                max_base_price: 0.8,
                                performance_grow_step: 0.1,
                                performance_grow_mult: 0,
                        },
                        {
                                type: "Hiker",
                                min_performance: 0,
                                max_base_price: 0.7,
                                performance_grow_step: 0.1,
                                performance_grow_mult: 0,
                        },
                ]

                for (const setting of settings) {
                        if (analize(item, setting)) {
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
                        // sneakersType: [
                        //         'hiker',
                        //         'coacher'
                        // ],
                        // mintMax: 0,
                        // levelMax: 0,
                        page: 1,
                        perPage: 100,
                }

                const sneakers = {
                        common: (await this.api.fetchNFT({
                                ...baseFetchOpts,
                                rarity: "common"
                        })).sales,
                        // uncommon: (await this.api.fetchNFT({
                        //         ...baseFetchOpts,
                        //         rarity: "uncommon"
                        // })).sales,
                        // rare: (await this.api.fetchNFT({
                        //         ...baseFetchOpts,
                        //         rarity: "rare"
                        // })).sales,
                }
                
                Object.values(sneakers).forEach((collection) => {
                        collection.forEach((i) =>
                                items.push({
                                        item: i,
                                        score: this.sneakersAnalizer(<Sneakers>i)
                                })
                        )
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
