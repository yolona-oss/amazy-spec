import { MarketItem } from './../Types/Market.js'
import { Sneakers } from './../Types/Sneakers.js'
import { Box } from './../Types/Box.js'
import { MarketApi } from './api.js'
import { SneakersAnalizerSettings, BoxAnalizerSettings } from './../Config.js'
import cfg from './../Config.js'

export interface AnalizerInterface {
        name: string
        boxAnalizer(item: Box, other: Box[]): Promise<number>
        sneakersAnalizer(item: Sneakers): number
        analize(): Promise<{item: MarketItem, score: number}[]>
}

function toBnb(n: number) {
        return n/1000000000000000000
}

class StaticAnalizer implements AnalizerInterface {
        constructor(private api: MarketApi = new MarketApi()) {
        }

        name = "static"

        async boxAnalizer(item: Box) {
                try {
                        const analize = (item: Box, settings: BoxAnalizerSettings) => {
                                if (
                                        item.priceEth <= settings.max_price
                                ) {
                                        if (mint1.primaryProperties.Type.toLowerCase() == settings.mint1.type.toLowerCase() || settings.mint1.type.toLowerCase() == "any") {
                                                if (mint2.primaryProperties.Type.toLowerCase() == settings.mint2.type.toLowerCase() || settings.mint2.type.toLowerCase() == "any") {
                                                        return true
                                                }
                                        }
                                }
                                return false
                        }

                        const mint1 = await this.api.getItemDetails(item.parents[0])
                        const mint2 = await this.api.getItemDetails(item.parents[1])
                        for (const setting of cfg['box-analizer']) {
                                if (analize(item, setting)) {
                                        return 1
                                }
                        }

                        return 0
                } catch (e) {
                        return 0
                }
        }

        sneakersAnalizer(item: Sneakers) {
                const analize = (item: Sneakers, settings: SneakersAnalizerSettings) => {
                        if ((settings.type == "any" || item.primaryProperties.Type.toLowerCase() == settings.type.toLowerCase())
                            && item.baseProperties.Performance >= settings.min_performance &&
                            (settings.min_mint ? item.primaryProperties.Mint >= settings.min_mint : true) && 
                            (settings.max_mint ? item.primaryProperties.Mint <= settings.max_mint : true) && 
                            toBnb(item.price) <= (item.baseProperties.Performance > settings.min_performance ?
                                                  settings.max_base_price + (item.baseProperties.Performance - settings.min_performance) /
                                                  settings.performance_grow_step * settings.performance_grow_mult
                                                  :
                                                  settings.max_base_price))
                        {
                                return true
                        }
                        return false
                }

                for (const setting of cfg['sneakers-analizer']) {
                        if (analize(item, setting)) {
                                return 1
                        }
                }

                return 0
        }

        async analize() {
                let items = new Array()

                const baseFetchOpts = {
                        sorting: "Price ascending",
                        page: 1,
                        perPage: 200,
                }

                const sneakers = {
                        common: (await this.api.fetchNFT({
                                ...baseFetchOpts,
                                type: "sneakers",
                                rarity: "common"
                        })).sales,
                        uncommon: (await this.api.fetchNFT({
                                ...baseFetchOpts,
                                type: "sneakers",
                                rarity: "uncommon"
                        })).sales,
                        rare: (await this.api.fetchNFT({
                                ...baseFetchOpts,
                                type: "sneakers",
                                rarity: "rare"
                        })).sales,
                }

                const boxes = {
                        common: (await this.api.fetchNFT({
                                ...baseFetchOpts,
                                type: "box",
                                rarity: "common"
                        })).sales,
                        uncommon: (await this.api.fetchNFT({
                                ...baseFetchOpts,
                                type: "box",
                                rarity: "uncommon"
                        })).sales,
                        rare: (await this.api.fetchNFT({
                                ...baseFetchOpts,
                                type: "box",
                                rarity: "rare"
                        })).sales,
                }

                Object.values(sneakers).forEach((collection) => {
                        collection.forEach((i) => {
                                items.push({
                                        item: i,
                                        score: this.sneakersAnalizer(<Sneakers>i)
                                })
                        })
                })

                // awaoiding forEach no await and promiss likes
                for (const collection of Object.values(boxes)) {
                        for (const item of collection) {
                                items.push({
                                        item,
                                        score: await this.boxAnalizer(<Box>item)
                                })
                        }
                }

                return items
        }
}

export const analizers = {
        static: StaticAnalizer,
}
