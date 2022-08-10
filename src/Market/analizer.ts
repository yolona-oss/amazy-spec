import axios from 'axios'
import { MarketItem } from './../Types/MarketItem.js'

export interface AnalizerInterface {
        buildIt(a: number): void

        boxAnalizer(item: MarketItem): number
        sneakersAnalizer(item: MarketItem): number
        analize(items: MarketItem[]): Map<MarketItem, number>
}

export class CommonAnalizer implements AnalizerInterface {
        buildIt(a: number) {
                a
        }

        boxAnalizer(item: MarketItem) {
                item
                return 1
        }

        sneakersAnalizer(item: MarketItem) {
                item
                return 1
        }

        analize(items: MarketItem[]) {
                return new Map<MarketItem, number>([
                        [ items[0], 0 ]
                ])
        }
}
