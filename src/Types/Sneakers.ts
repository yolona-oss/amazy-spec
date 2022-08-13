import { MarketItem } from "./Market.js"

type SneakersName = "Common Ranger Sneakers" |
        "Common Hiker Sneakers" |
        "Common Coacher Sneakers" |
        "Common Sprinter Sneakers" |

        "Uncommon Ranger Sneakers" |
        "Uncommon Hiker Sneakers" |
        "Uncommon Coacher Sneakers" |
        "Uncommon Sprinter Sneakers" |

        "Rare Ranger Sneakers" |
        "Rare Hiker Sneakers" |
        "Rare Coacher Sneakers" |
        "Rare Sprinter Sneakers" |

        "Legendary Ranger Sneakers" |
        "Legendary Hiker Sneakers" |
        "Legendary Coacher Sneakers" |
        "Legendary Sprinter Sneakers"

export interface Sneakers extends MarketItem {
        baseProperties: {
                Performance: number
                Fortune: number
                Joy: number
                Durability: number
        }
        primaryProperties: {
                Rarity: "Common" | "Uncomon" | "Rare" | "Legendary"
                Types: "Ranger" | "Hiker" | "Coacher" | "Sprinter"
                Performance: number
                Fortune: number
                Joy: number
                Durability: number
                Condition: number
                Mint: number
                Skin: string
                Parents: number[]
        }
        Types: "sneakers"
        name: SneakersName
}
