import * as fs from 'fs'
import { array, optional, min, pattern, Infer, assert, boolean, object, number, string } from 'superstruct'
import { readFileSync } from 'fs'
import { log } from './lib/logger/index.js'
import Path from 'path'

const _cfg_path = "./config.json"

const SneakersAnalizerSettingsSign = object({
        type: string(),

        min_performance: number(),

        min_level: optional(number()),
        max_level: optional(number()),
        min_mint: optional(number()),
        max_mint: optional(number()),

        max_base_price: number(),
        performance_grow_step: number(),
        performance_grow_mult: number()
})

const MintPropSign = object({
        type: string()
})

const BoxAnalizerSettingsSign = object({
        mint1: MintPropSign,
        mint2: MintPropSign,
        max_price: number(),
        rarity: optional(string()),
})

const keyPairSign = object({
        publicKey: string(),
        privateKey: string()
})

const ConfigSign = object({
        bot: object({
                token: pattern(string(), /^[0-9]{8,10}:[a-zA-Z0-9_-]{35}$/),
                admin_id: number()
        }),

        server: object({
                ngrok: object({
                        authtoken: string()
                }),

                database: object({
                        saveChatHistory: boolean(),
                        path: string(),
                }),

                fileStorage: object({
                        public_path: string(),
                        path: string(),
                }),

                port: min(number(), 1000),

                subdomain: string(),
                domain: string(),
        }),

        wallet: keyPairSign,
        watcher: object({
                autoBuy: boolean(),
                freqHz: number()
        }),

        "sneakers-analizer": array(SneakersAnalizerSettingsSign),
        "box-analizer": array(BoxAnalizerSettingsSign)
})

if (!fs.existsSync(_cfg_path)) {
        log.echo("Creating config with default params")
        let default_cfg: ConfigType = {
                bot: {
                        token: "",
                        admin_id: 0
                },

                server: {
                        ngrok: {
                                authtoken: ""
                        },

                        database: {
                                saveChatHistory: false,
                                path: "./storage",
                        },

                        fileStorage: {
                                public_path: Path.join("storage", "static"),
                                path: Path.join("storage", "files"),
                        },

                        port: 7999,

                        subdomain: "noapi",
                        domain: "no",
                },

                wallet: {
                        publicKey: "",
                        privateKey: ""
                },
                watcher: {
                        autoBuy: true,
                        freqHz: 1
                },
                "sneakers-analizer": [],
                "box-analizer": []
        }
        fs.writeFileSync(_cfg_path, JSON.stringify(default_cfg, null, " ".repeat(4)))
}

type ConfigType = Infer<typeof ConfigSign>;

function Config(): ConfigType {
        let config;
        try {
                config = JSON.parse(readFileSync(_cfg_path).toString());
        } catch(e) {
                throw new Error("Config parse error: " + e);
        }

        assert(config, ConfigSign);

        return config;
}

let cfg = Config()

export type BoxAnalizerSettings = Infer<typeof BoxAnalizerSettingsSign>
export type SneakersAnalizerSettings = Infer<typeof SneakersAnalizerSettingsSign>

export default cfg
