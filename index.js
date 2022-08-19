const discord = require('discord.js');
const request = require('request');

const token = 'BOT_TOKEN';

const client = new discord.Client({intents: [
    discord.GatewayIntentBits.DirectMessageReactions,
    discord.GatewayIntentBits.DirectMessageTyping,
    discord.GatewayIntentBits.DirectMessages,
    discord.GatewayIntentBits.GuildBans,
    discord.GatewayIntentBits.GuildEmojisAndStickers,
    discord.GatewayIntentBits.GuildIntegrations,
    discord.GatewayIntentBits.GuildInvites,
    discord.GatewayIntentBits.GuildMembers,
    discord.GatewayIntentBits.GuildMessageReactions,
    discord.GatewayIntentBits.GuildMessageTyping,
    discord.GatewayIntentBits.GuildMessages,
    discord.GatewayIntentBits.GuildPresences,
    discord.GatewayIntentBits.GuildScheduledEvents,
    discord.GatewayIntentBits.GuildVoiceStates,
    discord.GatewayIntentBits.GuildWebhooks,
    discord.GatewayIntentBits.Guilds,
    discord.GatewayIntentBits.MessageContent
], partials: [
    discord.Partials.Channel,
    discord.Partials.GuildMember,
    discord.Partials.GuildScheduledEvent,
    discord.Partials.Message,
    discord.Partials.Reaction,
    discord.Partials.ThreadMember,
    discord.Partials.User
]});

function shuffle(text) {
    let obj = {};
    for (let i = 0; i < text.length; i++) {
        let rand = Math.floor(Math.random() * 10000000);
        if (!obj[rand]) {
            obj[rand] = text[i];
        } else {
            i--;
        }
    }
    return Object.values(obj).join('');
}

process.on('uncaughtException', (err) => {
    client.channels.fetch('1008973466772439120')
    .then(channel => {
        channel.send('```\n' + err.stack + '\n```');
    });
});

client.on('ready', async c => {
    client.guilds.cache.forEach(async (key, value) => {
        await client.application.commands.set([{name: 'omikuji', description: 'おみくじを引きます\n隠し要素も！？'}, {name:'random_name', description:'名前をぐちゃぐちゃにします'}], value.id);
    });
    client.user.setPresence({activities:[{name:'now version 2.0.0'}]});
    client.channels.fetch('1008973466772439120')
    .then(channel => {
        channel.send('起動しました。\nversion 2.0.0');
    });
});

client.on('messageCreate', async m => {
    if (m.author.bot) return;
    if (m.channel.isDMBased()) {
        var options = {
            url: 'https://api.a3rt.recruit.co.jp/talk/v1/smalltalk',
            method: 'POST',
            form: {'apikey':'A3RT_TALKAPI_APIKEY','query':m.content},
            json:true,
            headers: {
                "Content-type": "application/x-www-form-urlencoded",
            }
        };
        request(options, function(err, res, body){
            if (body['results'] === undefined) {
                m.channel.send('[ERR]'+body['status']+' '+body['message']);
                return;
            }
            m.channel.send(body['results'][0]['reply']);
        });
        return;
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        if (interaction.commandName === 'omikuji') {
            var omikuji_list = [['大吉！', 'いいことあるかも！'],['中吉！', 'いいじゃん！今日も頑張ろ！'], ['小吉','悪くはないよ！'], ['吉', '普通、、、かな？'], ['末吉', '(´・ω・｀)'], ['凶', 'まだまだ巻き返せる！'], ['鯖吉！', 'こりゃまた磯の匂いがしますなぁ\nところでさばちゃ副官おめでとう！'], ['しお吉！', '大当たりやなぁ！\n今日はいい日になるでぇー'], ['ヨル吉！', '頼れるヨルムや！\n今日は絶対いい事あります！'], ['すこ吉！', '面白いすこたろが出てきたなぁ\nあれ、ろたこすだったっけ？']];
            var max = omikuji_list.length;
            var min = 0;
            var num = Math.floor(Math.random() * (max - min)) + min;
            await interaction.reply({content: 'ガラガラっ、、！', embeds: [{title:omikuji_list[num][0], description:omikuji_list[num][1]}], ephemeral: false});
            return;
        }
        if (interaction.commandName === 'random_name') {
            var before = interaction.member.nickname;
            if (before === null) {
                before = interaction.member.user.username;
            }
            interaction.member.edit({nick: shuffle(before)});
        }
    }
});

client.login(token);
