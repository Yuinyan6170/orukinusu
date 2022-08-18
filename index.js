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

process.on('uncaughtException', (err) => {
    client.channels.fetch('1008973466772439120')
    .then(channel => {
        channel.send('```\n' + err.stack + '\n```');
    });
});

client.on('ready', async c => {
    client.guilds.cache.forEach(async (key, value) => {
        await client.application.commands.set([{name: 'test', description: 'this is a test for slash command'}], value.id);
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
            if (body['results'] === undefiend) {
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
        if (interaction.commandName === 'test') {
            await interaction.reply({content: 'できたァァァァァァ', ephemeral: false});
        }
    }
});

client.login(token);
