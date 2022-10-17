import { MarketItem } from "./Market.js"

export interface Box extends MarketItem {
        primaryProperties: {
                Rarity: "Common" | "Uncomon" | "Rare" | "Legendary"
                Type: "Ranger" | "Hiker" | "Coacher" | "Sprinter" |
                        "Box"
                Parents: number[]
        }
        type: "box"
        name: "Common Box" | "Uncommon Box" | "Rare Box" | "Legendary Box"
}
