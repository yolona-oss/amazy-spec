import axios from 'axios'
import { MarketItem } from './../Types/Market.js'
import { MarketApi } from './api.js'

export interface AnalizerInterface {
        buildIt(a: number): void

        boxAnalizer(item: MarketItem): number
        sneakersAnalizer(item: MarketItem): number
        analize(): Promise<{item: MarketItem, score: number}[]>
}

export class FloorAnalizer implements AnalizerInterface {
        private _curStepItems: {item: MarketItem, score: number}[]

        constructor(private api: MarketApi) {
                this._curStepItems = new Array()
        }

        buildIt(a: number) {
                a
        }

        /* private */ boxAnalizer(item: MarketItem) {
                item
                return 1
        }

        /* private */ sneakersAnalizer(item: MarketItem) {
                item
                return 1
        }

        async analize() {
                this._curStepItems = new Array()

                const sneakers = (await this.api.fetchNFT({
                        type: "sneakers"
                })).sales
                const box = (await this.api.fetchNFT({
                        type: "box"
                })).sales

                for (const i of sneakers.concat(box)) {
                        this._curStepItems.push({
                                item: i,
                                score: (
                                        i.Types == "box" ?
                                        this.boxAnalizer(i) : this.sneakersAnalizer(i)
                                )
                        })
                }

                return this._curStepItems
        }
}

export class SmartAnalizer implements AnalizerInterface {
        private _curStepItems: {item: MarketItem, score: number}[]

        constructor(private api: MarketApi) {
                this._curStepItems = new Array()
        }

        buildIt(a: number) {
                a
        }

        /* private */ boxAnalizer(item: MarketItem) {
                item
                return 1
        }

        /* private */ sneakersAnalizer(item: MarketItem) {
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
                const box = (await this.api.fetchNFT({
                        type: "box"
                })).sales

                for (const i of sneakers.concat(box)) {
                        this._curStepItems.push({
                                item: i,
                                score: (
                                        i.Types == "box" ?
                                        this.boxAnalizer(i) : this.sneakersAnalizer(i)
                                )
                        })
                }

                return this._curStepItems
        }
}

export let ANALIZERS: Map<string, AnalizerInterface> = new Map()
// ANALIZERS.set("Floor", FloorAnalizer)
