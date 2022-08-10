import axios from 'axios'
import { MarketSearchParams } from "./../Types/MarketSearchParameters.js"


export class MarketApi {
        constructor(private api_url: string) {

        }

        fetch(param: Partial<MarketSearchParams>) {
                param
        }
}
