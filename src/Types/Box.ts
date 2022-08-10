import { MarketItem } from "./MarketItem.js"

export interface Box extends MarketItem {
        primaryProperties: {
                Rarity: "Common" | "Uncomon" | "Rare" | "Legendary"
                Types: "Ranger" | "Hiker" | "Coacher" | "Sprinter" |
                        "Box"
                Parents: number[]
        }
        Types: "box"
        name: "Common Box" | "Uncommon Box" | "Rare Box" | "Legendary Box"
}
