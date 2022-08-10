import * as tg from 'telegraf'
import { EventEmitter } from 'events'
import { Database, Manager, Chat } from './database.js'
import { ChatServer } from './ChatService.js'
import { Config } from './Config.js'
import { AnalizerInterface } from './Market/analizer.js'
import { MarketApi } from './Market/api.js'

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
                ctx.reply("Hello, dummy comman here :)");
                // ctx.replyWithSticker(this.stickers.welcoming);
        }

        let help = <Command>async function(this: BotService, ctx: TextContext) {
                let msg: string = "";
                Object.values(commands).forEach((cmd) => {
                        msg += "/" + cmd.name + " - " + cmd.description + ". Arg: " + cmd.args + "\n";
                })
                ctx.reply(msg);
        }

        let setname = <Command>async function(this: BotService, ctx: TextContext) {
                let name = "";
                if (ctx.message && ctx.message.text) {
                        name = String(ctx.message.text.slice('setname'.length+2)).trim();
                }
                if (name !== "") {
                        await ctx.manager.setName(name);
                        ctx.reply("Now your will called " + name);
                } else {
                        ctx.reply('No string passed, try: "/setname The Emperor"');
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
                        ctx.reply("Loading error. Try another time");
                }
        }

        let goonline = <Command>async function(this: BotService, ctx: TextContext) {
                await ctx.manager.setOnline(true);
        }

        let gooffline = <Command>async function(this: BotService, ctx: TextContext) {
                await ctx.manager.setOnline(false);
        }

        let status = <Command>async function(this: BotService, ctx: TextContext) {
                ctx.reply("Your status: " + (ctx.manager.online ? "online" : "offline"))
        }


        let setautobuy = <Command>async function(this: BotService, ctx: TextContext) {
                let data = "";
                if (ctx.message && ctx.message.text) {
                        data = String(ctx.message.text.slice('setautobuy'.length+2)).trim();
                }
                if (data !== "") {
                        await ctx.manager.setName(data);
                } else {
                        ctx.reply(new Error('data passed').message);
                }
        }

        let setautosell = <Command>async function(this: BotService, ctx: TextContext) {

        }

        let setspeculationargesy = <Command>async function(this: BotService, ctx: TextContext) {

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
                setspeculationargesy,
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
                let keyboard = tg.Markup.inlineKeyboard([ [
                        {   text: "Approve",
                                callback_data: cb_data.approveManager + " " + id },
                        {   text: "Reject",
                                callback_data: cb_data.rejectManager + " " + id }
                ] ])
                await ctx.telegram.sendMessage(Config().bot.admin_id, "Approve request from @" + ctx.from!.username,
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

        async function message(this: BotService, args: any) {
                let { chat, message } = args;
                if (chat.managerId) {
                        // this.bot.telegram.sendMessage(chat.managerId, message.from.name + ":\n" + message.text);
                        this.bot.telegram.sendMessage(chat.managerId, chat.initiator + ":\n" + message.text);
                }
        }

        return {
                message,
        }
})()

export class SpeculantService extends EventEmitter {
        private sell: {
                automatic: boolean

                priceDifference: number
        }

        private buy: {
                automatic: boolean

                minFlorDifference: number
        }

        private agression: {
                buy: number
                sell: number
        }

        constructor(analizer: AnalizerInterface) {
                super()
        }

        setAutoBuy(activate: boolean) {
                this.buy.automatic = activate
        }

        setAutoSell(activate: boolean) {
                this.sell.automatic = activate
        }
}

export class BotService extends EventEmitter {
        public readonly bot: tg.Telegraf<Context>;

        private running: boolean = false;

        public onStop: () => void = () => {}

        // private readonly stickers = {
        //     welcoming: "CAACAgIAAxkBAAEEh85iYatAqlMz81qfn7Dk303ummYrjwACGBEAAvE40EoZjSpXJ-H1-CQE",
        //     happy:     "CAACAgIAAxkBAAEEh9BiYatNE-M0LO7eJ6A8rERHIennowAC9A8AAuauOUpmEnHaU53szyQE",
        //     sad:       "CAACAgIAAxkBAAEEh9ZiYavBfd0mfaBWTzqMeBSYbwkB7wACjxMAAosj2UpwO-yY639C-iQE",
        //     evil:      "CAACAgIAAxkBAAEEh9JiYate-8ItpkQBSCowdGmwTHzR8wAC0hEAAjnxkUtIXF3Fd0t44iQE",
        //     verySad:   "CAACAgIAAxkBAAEEh9RiYaueiAN4zPax481xTRns1EYlRQAC0hAAAtOfOEp18SByrhUeJiQE",
        // }

        constructor() {
                super();
                this.bot = new tg.Telegraf(Config().bot.token);

                this.bot.use(async (ctx, next) => {
                        let mngr = await Manager.findOne({ userId: ctx.from!.id })
                        if (mngr) {
                                ctx.manager = mngr;
                                return next();
                        } else if (ctx.updateType == 'callback_query') {
                                let _ctx: CqContext = <CqContext>ctx;
                                if (_ctx.match.input.includes(cb_data.approveRequest)) {
                                        return next();
                                }
                        }
                        await ctx.replyWithMarkdown("Welcome to amazy-spec bot. To start using bot you need to be aproved by bot administrator.\n" +
                                "Click on button for send approve request",
                                tg.Markup.inlineKeyboard([ [ { text: "Send", callback_data: cb_data.approveRequest + " " + ctx.from!.id  }, ] ]));
                })

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

        async start() {
                if (this.running) {
                        return;
                }
                try {
                        let adminExisted = true;
                        let admin = await Database.managers.findOne({ userId: Config().bot.admin_id })
                        if (!admin) {
                                adminExisted = false;
                                Database.managers.insertOne({
                                        isAdmin: true,
                                        name: "Admin",
                                        userId: Config().bot.admin_id,
                                        online: false,
                                        avatar: (await Database.files.getDefaultAvatar()).file_id
                                })
                        }
                        await this.bot.launch();
                        this.running = true;
                        if (adminExisted) {
                                for (let mngr of await Manager.findMany({})) {
                                        this.bot.telegram.sendMessage(mngr.userId, "Service now online");
                                        // this.bot.telegram.sendSticker(mngr.userId, this.stickers.happy);
                                }
                        }
                        console.log("Telegram-bot service started");
                } catch(e) {
                        throw e;
                }
        }

        async stop() {
                if (!this.running) return;
                this.running = false;
                await Database.managers.updateMany({ online: true }, { online: false });
                await Database.managers.save();
                let mngrs = Database.managers.documents;
                for (let m of mngrs) {
                        await this.bot.telegram.sendMessage(m.userId, "Service going offline");
                        // await this.bot.telegram.sendSticker(m.userId, this.stickers.verySad);
                }
                this.bot.stop();
                await this.onStop();
        }

        chooseMarkup(accept: string, decline: string) {
                return tg.Markup.inlineKeyboard([ tg.Markup.button.callback("Accept", accept),
                        tg.Markup.button.callback("Decline", decline) ])
        }
}
