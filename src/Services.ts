import * as tg from 'telegraf'
import { EventEmitter } from 'events'
import { Database, Manager } from './database.js'
import cfg from './Config.js'
import { Bot } from './Bot.js'
import { analizers } from './Market/analizer.js'

interface Context extends tg.Context {
        manager: Manager
}

type TextContext = tg.NarrowedContext<Context, tg.Types.MountMap['text']>;
type Command = {
        (this: BotService, ctx: TextContext): Promise<void>;
        description: string;
        args: string;
}
const commands = (()=> {
        let start = <Command>async function(this: BotService, ctx: TextContext) {
                await ctx.reply("Hello, dummy comman here :)");
        }

        let help = <Command>async function(this: BotService, ctx: TextContext) {
                let msg: string = "";
                Object.values(commands).forEach((cmd) => {
                        msg += "/" + cmd.name + " "/*.repeat(maxCmdLen - cmd.name.length+1)*/
                                + cmd.description + ". Arg: " + cmd.args + "\n\n";
                })
                await ctx.reply(msg);
        }

        let setname = <Command>async function(this: BotService, ctx: TextContext) {
                let name = "";
                if (ctx.message && ctx.message.text) {
                        name = String(ctx.message.text.slice('setname'.length+2)).trim();
                }
                if (name !== "") {
                        await ctx.manager.setName(name);
                        await ctx.reply("Now your will called " + name);
                } else {
                        await ctx.reply('No string passed, try: "/setname The Emperor"');
                }
        }

        let updateavatar = <Command>async function(this: BotService, ctx: TextContext) {
                let photos = await ctx.telegram.getUserProfilePhotos(ctx.from.id, 0, 1);
                let file   = await ctx.telegram.getFile(photos.photos[0][0].file_id);
                let url    = await ctx.telegram.getFileLink(file.file_id);
                let l_file = await Database.files.saveFile(url.href, "avatars");
                if (l_file) {
                        await ctx.manager.setAvatar(l_file.file_id);
                } else {
                        await ctx.reply("Loading error. Try another time");
                }
        }

        let goonline = <Command>async function(this: BotService, ctx: TextContext) {
                await ctx.manager.setOnline(true);
        }

        let gooffline = <Command>async function(this: BotService, ctx: TextContext) {
                await ctx.manager.setOnline(false);
        }

        let status = <Command>async function(this: BotService, ctx: TextContext) {
                await ctx.reply("Your status: " + (ctx.manager.online ? "online" : "offline"))
        }

        let setautobuy = <Command>async function(this: BotService, ctx: TextContext) {
                let data = "";
                if (ctx.message && ctx.message.text) {
                        data = String(ctx.message.text.slice('setautobuy'.length+2)).trim();
                }
                if (data !== "") {
                        if (data === "true") {
                                await ctx.reply("Auto buy is enabled")
                                this.marketBot.enableAutoBuy()
                        } else if (data === "false") {
                                await ctx.reply("Auto buy is disabled")
                                this.marketBot.disableAutoBuy()
                        } else {
                                await ctx.reply("Invalida input")
                        }
                } else {
                        await ctx.reply(new Error('no data passed').message);
                }
        }

        let setautosell = <Command>async function(this: BotService, ctx: TextContext) {
                // TODO

                ctx.reply("Not impl")
                return
        }

        let setwallet = <Command>async function(this: BotService, ctx: TextContext) {
                let data = "";
                if (ctx.message && ctx.message.text) {
                        data = String(ctx.message.text.slice('setwallet'.length+2)).trim();
                }
                if (data !== "") {
                        let ok = await this.marketBot.azyApi.setWallet(data.split(' ')[0], data.split(' ')[1])
                        if (ok) {
                                ctx.reply("Wallet change success")
                        } else {
                                ctx.reply("Wallet change failed")
                        }
                } else {
                        ctx.reply(new Error('no data passed').message);
                }
        }

        let showwallet = <Command>async function(this: BotService, ctx: TextContext) {
                if (ctx.manager.isAdmin) {
                        ctx.reply("Wallet address:" + (this.marketBot.azyApi.connectedWallet().publicKey ?? "no") + "\n" +
                                  " private key: " + (this.marketBot.azyApi.connectedWallet().privateKey ?? "no"))
                        return
                }
                // TODO unify this reply
                ctx.reply("Permission denied")
        }

        let setwatcherfreq = <Command>async function(this: BotService, ctx: TextContext) {
                // TODO

                let data = "";
                if (ctx.message && ctx.message.text) {
                        data = String(ctx.message.text.slice('setwatcherfreq'.length+2)).trim();
                        if (Number(data) > 0) {
                                this.marketBot.watcher.setFreq(Number(data))
                        } else {
                                ctx.reply(new Error('Its not number or number is below zero').message);
                        }
                }
                if (data !== "") {
                        await ctx.manager.setName(data);
                } else {
                        ctx.reply(new Error('data passed').message);
                }
        }

        let addproxywatcher = <Command>async function(this: BotService, ctx: TextContext) {
                // TODO

                ctx.reply("Not impl")
                return
        }

        let removeproxywatcher = <Command>async function(this: BotService, ctx: TextContext) {
                // TODO

                ctx.reply("Not impl")
                return
        }

        let watchers = <Command>async function(this: BotService, ctx: TextContext) {
                // TODO

                ctx.reply("Not impl")
                return
        }

        let showsettings = <Command>async function(this: BotService, ctx: TextContext) {
                // TODO

                let settings_str = ""

                // watcher status
                settings_str += "Watcher active: " + String(!this.marketBot.watcher.Terminated) + '\n'

                // Analizer
                settings_str += "Analizator: " + String(this.marketBot.watcher.CurrentAnalizer) + '\n'

                // Autobuy
                settings_str += "Auto buy: " + String(this.marketBot.isAutoBuyEnabled) + '\n'

                // Autosell
                settings_str += "Auto sell: " + String(false) + '\n'

                // wallet
                if (ctx.manager.isAdmin) {
                        const wallet = this.marketBot.azyApi.connectedWallet()
                        settings_str +=
                                "Wallet address:" + (wallet.publicKey ?? "no") + "\n" + 
                                " private key: " + (wallet.privateKey ?? "no")
                }

                ctx.reply(settings_str)
        }

        let showstatistic = <Command>async function(this: BotService, ctx: TextContext) {
                // TODO

                ctx.reply("Not impl")
                return
        }

        let setanalizer = <Command>async function(this: BotService, ctx: TextContext) {
                let data = "";
                if (ctx.message && ctx.message.text) {
                        data = String(ctx.message.text.slice('setanalizer'.length+2)).trim();
                }
                if (data !== "") {
                        if (Object.keys(analizers).includes(data)) {
                                // @ts-ignore
                                await this.marketBot.watcher.changeAnalizer(new analizers[data])
                                await ctx.reply("Analizer changed")
                        } else {
                                await ctx.reply("Such analizers not exists")
                        }
                } else {
                        await ctx.reply(new Error('data passed').message);
                }
        }

        let listanalizers = <Command>async function(this: BotService, ctx: TextContext) {
                let str = ""
                for (const a of Object.keys(analizers)) {
                        str += "\n- " + a
                }
                await ctx.reply("Avalible analizers:"+str)
        }

        let currentanalizer = <Command>async function(this: BotService, ctx: TextContext) {
                await ctx.reply("Setting up with " + this.marketBot.watcher.CurrentAnalizer)
        }

        let mynft = <Command>async function(this: BotService, ctx: TextContext) {
                // TODO

                ctx.reply("Not impl")
                return
        }

        let nftallowedtosell = <Command>async function(this: BotService, ctx: TextContext) {
                // TODO

                ctx.reply("Not impl")
                return
        }

        let toggle = <Command>async function(this: BotService, ctx: TextContext) {
                if (this.marketBot.watcher.Terminated) {
                        await ctx.reply("Now speculant watcher is online")
                        try {
                                this.marketBot.watcher.start()
                        } catch(e: any) {
                                await ctx.reply(e)
                        }
                } else {
                        await ctx.reply("Now speculant watcher terminated")
                        try {
                                await this.marketBot.watcher.stop()
                        } catch(e: any) {
                                await ctx.reply(e)
                        }
                }
        }

        let isactive = <Command>async function(this: BotService, ctx: TextContext) {
                await ctx.reply(!this.marketBot.watcher.Terminated ? "Active" : "Terminated")
        }

        status.description = "get current status";
        status.args = "no";

        goonline.description = "change status to online";
        goonline.args = "no";

        gooffline.description = "change status to offline";
        gooffline.args = "no";

        updateavatar.description = "update avatar to current profile avatar";
        updateavatar.args = "no";

        setname.description = "change displaing name to new";
        setname.args = "string";

        start.description = "start chat with bot";
        start.args = "no";

        help.description = "show help message";
        help.args = "no";

        setautobuy.description = "set auto buy property"
        setautobuy.args = 'string - "true" or "false"'

        setautosell.description = "set auto buy property"
        setautosell.args = 'string - "true" or "false"'

        setwallet.description = "set wallet to pay and recive assets from market"
        setwallet.args = "string string - bsc account public and private keys"

        showwallet.description = "show wallet"
        showwallet.args = 'no'

        setwatcherfreq.description = "set hz frequency to watcher iterations"
        setwatcherfreq.args = "number - hz"

        addproxywatcher.description = "Not implemented"
        addproxywatcher.args = "Not implemented"

        removeproxywatcher.description = "Not implemented"
        removeproxywatcher.args = "Not implemented"

        watchers.description = "Not implemented"
        watchers.args = "Not implemented"

        showsettings.description = "Not implemented"
        showsettings.args = "Not implemented"

        showstatistic.description = "Not implemented"
        showstatistic.args = "Not implemented"

        setanalizer.description = "set market analizator"
        setanalizer.args = "string - avalible analizator name"

        listanalizers.description = "show list of avalible analizators"
        listanalizers.args = "no"

        currentanalizer.description = "show current analizator"
        currentanalizer.args = "no"

        mynft.description = "Not implemented"
        mynft.args = "Not implemented"

        nftallowedtosell.description = "Not implemented"
        nftallowedtosell.args = "Not implemented"

        toggle.description = "toggle speculant"
        toggle.args = "no"

        isactive.description = "check speculat status"
        isactive.args = "no"

        return {
                status,
                goonline,
                gooffline,
                updateavatar,
                setname,
                start,
                help,

                setautobuy,
                setautosell,

                setwallet,
                showwallet,

                setwatcherfreq,
                addproxywatcher,
                removeproxywatcher,
                watchers,

                showsettings,
                showstatistic,

                setanalizer,
                listanalizers,
                currentanalizer,

                mynft,
                nftallowedtosell,

                toggle,
                isactive
        }
})()

const cb_data = {
        approveRequest: 'approve_request',
        approveManager: 'approve_manager',
        rejectManager: 'reject_manager',
};

type CqContext = tg.NarrowedContext<Context & { match: RegExpExecArray; }, tg.Types.MountMap['callback_query']>;
let actions = (() => {

        async function approverequest(this: BotService, ctx: CqContext, next: () => void) {
                let id = ctx.match.input.slice(cb_data.approveRequest.length);
                let keyboard = tg.Markup.inlineKeyboard([
                        [
                                {
                                        text: "Approve",
                                        callback_data: cb_data.approveManager + " " + id
                                },
                                {
                                        text: "Reject",
                                        callback_data: cb_data.rejectManager + " " + id
                                }
                        ]
                ])
                await ctx.telegram.sendMessage(cfg.bot.admin_id, "Approve request from @" + ctx.from!.username,
                                               keyboard);
                                               next();
        }

        async function approvemanager(this: BotService, ctx: CqContext, next: () => void) {
                let userId = Number(ctx.match.input.slice(cb_data.approveManager.length));
                let member = await this.bot.telegram.getChatMember(userId, userId);
                await (new Manager({
                        userId: userId,
                        name: member.user.first_name + " " + member.user.last_name,
                        avatar: (await Database.files.getDefaultAvatar()).file_id
                })).sync();

                await this.bot.telegram.sendMessage(userId, "Your request have been accepted. Now you are can use this bot");
                next();
        }

        async function rejectmanager(this: BotService, ctx: CqContext, next: () => void) {
                let userId = Number(ctx.match.input.slice(cb_data.rejectManager.length));
                await this.bot.telegram.sendMessage(userId, "Your request have been rejected");
                // this.bot.telegram.sendSticker(userId, this.stickers.evil);
                next();
        }

        return {
                approverequest,
                approvemanager,
                rejectmanager
        }
})()

const csAction = (() => {
        return {
        }
})()

export class BotService extends EventEmitter {
        public readonly bot: tg.Telegraf<Context>;
        public readonly marketBot

        private running: boolean = false;

        public onStop: () => void = () => {}

        private readonly stickers = {
                welcoming: "CAACAgIAAxkBAAEEh85iYatAqlMz81qfn7Dk303ummYrjwACGBEAAvE40EoZjSpXJ-H1-CQE",
                happy:     "CAACAgIAAxkBAAEEh9BiYatNE-M0LO7eJ6A8rERHIennowAC9A8AAuauOUpmEnHaU53szyQE",
                sad:       "CAACAgIAAxkBAAEEh9ZiYavBfd0mfaBWTzqMeBSYbwkB7wACjxMAAosj2UpwO-yY639C-iQE",
                evil:      "CAACAgIAAxkBAAEEh9JiYate-8ItpkQBSCowdGmwTHzR8wAC0hEAAjnxkUtIXF3Fd0t44iQE",
                verySad:   "CAACAgIAAxkBAAEEh9RiYaueiAN4zPax481xTRns1EYlRQAC0hAAAtOfOEp18SByrhUeJiQE",
        }

        constructor() {
                super();
                this.marketBot = new Bot()
                this.bot = new tg.Telegraf(cfg.bot.token);

                this.marketBot.on("buy", async (s: string) => {
                        for (const m of Database.managers.documents) {
                                await this.bot.telegram.sendMessage(m.userId, s)
                        }
                })

                this.bot.use(async (ctx, next) => {
                        let mngr = await Manager.findOne({ userId: ctx.from!.id })
                        if (mngr) {
                                ctx.manager = mngr;
                                return next();
                        } else if (ctx.updateType == 'callback_query') {
                                // @ts-ignore
                                if (ctx.update.callback_query.data.includes(cb_data.approveRequest)) {
                                        return next();
                                }
                        }
                        console.log(cb_data.approveRequest + " " + ctx.from!.id)
                        await ctx.replyWithMarkdown("Welcome to amazy-spec bot. To start using bot you need to be aproved by bot administrator.\n" +
                                                    "Click on button for send approve request",
                        tg.Markup.inlineKeyboard([ [ { text: "Send", callback_data: cb_data.approveRequest + " " + ctx.from!.id  }, ] ]));
                })

                // this.bot.on('callback_query', ())

                Object.values(commands).forEach(cmd =>
                                                this.bot.command(cmd.name, (ctx) => cmd.call(this,ctx))
                                               )

                                               this.bot.action(RegExp(cb_data.approveRequest + "*"), (ctx, next) => actions.approverequest.call(this, ctx, next));
                                               this.bot.action(RegExp(cb_data.approveManager + "*"), (ctx, next) => actions.approvemanager.call(this, ctx, next));
                                               this.bot.action(RegExp(cb_data.rejectManager + "*"),  (ctx, next) => actions.rejectmanager.call(this, ctx, next));

                                               // Its muts be declared after ALL commands!
                                               // this.bot.on('text', actions.text.bind(this));
        }

        deconstructor() {
        }

        private async setBotCommands() {
                this.bot.telegram.setMyCommands(
                        Object.values(commands).map(cmd => {
                                return {
                                        command: '/' + cmd.name,
                                        description: cmd.description
                                }
                        })
                )
        }

        async start() {
                if (this.running) {
                        return;
                }
                try {
                        let adminExisted = true;
                        let admin = await Database.managers.findOne({ userId: cfg.bot.admin_id })
                        if (!admin) {
                                adminExisted = false;
                                Database.managers.insertOne({
                                        isAdmin: true,
                                        name: "Admin",
                                        userId: cfg.bot.admin_id,
                                        online: false,
                                        avatar: (await Database.files.getDefaultAvatar()).file_id
                                })
                        }
                        await this.bot.launch();
                        await this.setBotCommands()
                        this.running = true;
                        if (adminExisted) {
                                // for (let mngr of await Manager.findMany({})) {
                                //         await this.bot.telegram.sendMessage(mngr.userId, "Service now online");
                                //         // this.bot.telegram.sendSticker(mngr.userId, this.stickers.happy);
                                // }
                        }
                        console.log("Telegram-bot service started");
                        this.marketBot.init()
                } catch(e) {
                        throw e;
                }
        }

        async stop() {
                if (!this.running) return;
                this.running = false;
                await Database.managers.updateMany({ online: true }, { online: false });
                await Database.managers.save();
                // let mngrs = Database.managers.documents;
                // for (let m of mngrs) {
                //         await this.bot.telegram.sendMessage(m.userId, "Service going offline");
                //         // await this.bot.telegram.sendSticker(m.userId, this.stickers.verySad);
                // }
                this.bot.stop();
                await this.marketBot.Dispose()
                this.onStop();
        }

        chooseMarkup(accept: string, decline: string) {
                return tg.Markup.inlineKeyboard([ tg.Markup.button.callback("Accept", accept),
                                                tg.Markup.button.callback("Decline", decline) ])
        }
}
