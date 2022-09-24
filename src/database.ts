import * as fs from 'fs'
import * as crypt from 'crypto'
import download from 'download'
import * as mime from 'mime-types'
import { Database as ADatabase } from 'aloedb-node'
import { assert } from 'superstruct'
import cfg from './Config.js'

import { FileSchema, FileSign } from './Schemas/File.js'
import { ManagerSign, ManagerSchema, IManager } from './Schemas/Manager.js'

const dirs = [
        cfg.server.database.path,
        cfg.server.fileStorage.path,
        cfg.server.fileStorage.public_path,
]

for (let dir of dirs) {
        if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true })
        }
}

const ManagerEntryValidator = (document: any) => assert(document, ManagerSign)
const FileEntryValidator = (d: any) => assert(d, FileSign)

const managers = new ADatabase<ManagerSchema>({
        path: cfg.server.database.path + "/managers.json",
        pretty: false,
        autoload: true,
        immutable: true,
        onlyInMemory: false,
        schemaValidator: ManagerEntryValidator
});

const files_db = new ADatabase<FileSchema>({
        path: cfg.server.database.path + "/files.json",
        pretty: false,
        autoload: true,
        immutable: true,
        onlyInMemory: false,
        schemaValidator: FileEntryValidator,
});

if (!fs.existsSync(cfg.server.fileStorage.path + "/static/manager-icon.png")) {
        fs.copyFileSync("assets/manager-icon.png", cfg.server.fileStorage.path + "/static/manager-icon.png")
        files_db.insertOne({
                file_id: 0,
                file_mime: "image/png",
                path: cfg.server.fileStorage.path + "/static/manager-icon.png",
                group: "static",
        })
}

export class Files {
        constructor() { }

        async getFile(id: number): Promise<FileSchema | null> {
                return await files_db.findOne({ file_id: id });
        }

        async saveFile(url: string, group: string): Promise<FileSchema | null> {
                const _mime = mime.lookup(url);
                const ext = _mime ? mime.extension(_mime) : null;
                const sufix = (ext ? "." + ext : "");
                // best string size: Number.MAX_INT ... TODO
                const filename = crypt.randomBytes(30).toString('hex').slice(0, 30) + sufix;
                const path = cfg.server.fileStorage.path + '/' + filename;
                let res = await download(url, cfg.server.fileStorage.path, { filename: filename });

                let schema = { //Number(crypt.randomInt(Number.MIN_SAFE_INTEGER+1, Number.MAX_SAFE_INTEGER-1)),
                        file_id: Number(crypt.randomInt(281474976710655)),
                        file_mime: mime.lookup(path) || "unknown",
                        path: path,
                        group: group
                }
                if (res) {
                        await files_db.insertOne(schema)
                        return schema;
                } else {
                        return null;
                }
        }

        async getDefaultAvatar(): Promise<FileSchema> {
                return <FileSchema>(await this.getFile(0));
        }
}

export const Database = { managers, files: new Files() }

export class Manager implements IManager {
        userId: number; // telegram user id
        name: string;
        isAdmin: boolean;
        online: boolean;
        avatar: number;

        constructor(mngr: IManager) {
                this.userId = mngr.userId;
                this.name = mngr.name;
                this.isAdmin = mngr.isAdmin ?? false;
                this.online = mngr.online ?? false;
                this.avatar = mngr.avatar;
        }

        async sync() {
                if (await managers.findOne({ userId: this.userId })) {
                        return managers.updateOne({ userId: this.userId }, this);
                } else {
                        return managers.insertOne(this);
                }
        }

        remove() {
                return managers.deleteOne({ userId: this.userId });
        }

        async setOnline(online: boolean) {
                this.online = online;
                return await this.sync();
        }

        async setName(name: string) {
                this.name = name;
                return await this.sync();
        }

        async setAvatar(file_id: number) {
                this.avatar = file_id;
                return await this.sync();
        }

        static async findOne(query: Partial<IManager>): Promise<Manager | null> {
                const object = await managers.findOne(query);
                if (object) return new Manager(object);
                return null;
        }

        static async findMany(query: Partial<IManager>): Promise<Manager[]> {
                const objects = await managers.findMany(query);

                return objects.map((obj) => {
                        return new Manager(obj);
                });
        }
}
