export interface MarketSearchParams {
        levelMax: number
        levelMin: number
        mintMax:  number
        mintMin:  number
        page:     number
        perPage:  number
        type:     string | "sneakers" | "box"
        rarity:   string | "common" | "uncommon" | "rare" | "legendary"
        valueMax: number
        valueMin: number
}

export interface MarketItem {
        primaryProperties: {
                Rarity: "Common" | "Uncomon" | "Rare" | "Legendary"
                Types: "Ranger" | "Hiker" | "Coacher" | "Sprinter" |
                        "Box"
                Parents: number[]
        }
        _id: string
        Types: "box" | "sneakers"
        name: "Common Box" | "Uncommon Box" | "Rare Box" | "Legendary Box" |
                "Common Ranger Sneakers" |
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
        tokenId: number
        hash: string
        level: number
        owner: string
        isBurned: boolean
        parents: number[]
        priceEth: number
        isLocked: boolean
        lockedTo: number
        levelupTimeout: number
        pairingCoolDown: number
        createdAt: string
        updatedAt: string
        __v: number
        currency: "BNB" | "ETH"
        price: number
        sellId: number
}

export interface MarketSearchRes {
        sales: MarketItem[]
        my: MarketItem[],
        salesTotal: number
        myCount: number
}
