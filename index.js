const { joinVoiceChannel, AudioPlayer, AudioResource, createAudioResource, createAudioPlayer } = require('@discordjs/voice');
const discord = require('discord.js');
const request = require('request');
const {createReadStream} = require('node:fs');
const { join, resolve } = require('node:path');
const path = require('path');
const fs = require('fs');
const {exec} = require('child_process');
const youtubeMp3Converter = require('youtube-mp3-converter');
const { ChannelType } = require('discord.js');
const getYouTubeID = require('get-youtube-id');
const usetube = require('usetube');
const getYotubePlaylistId = require('get-youtube-playlist-id');
const yve = require('youtube-video-exists');
const asy = require('async');

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

var players = {};
var queue = {};
var connections = {};

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
        await client.application.commands.set([
            {name: 'omikuji', description: 'おみくじを引きます\n隠し要素も！？'},
            {name:'random_name', description:'名前をぐちゃぐちゃにします'},
            {name:'test', description:'テストコマンドです'},
            {name:'pause', description:'曲を止めます'},
            {name:'unpause', description:'曲を再開します'},
            {name:'youtube', description:'youtubeから音楽を流します\nオプションなしで実行するとキューの中身を表示します', options:[{type:3, name:'youtube_url', description:'youtubeの動画のURLです'}]},
            {name:'skip', description:'曲をスキップします'},
            {name: 'rename_vc', description: 'VC作成で作ったVCに参加しながら使用するとVCの名前を変えられます', options: [{type: 3, name: 'vc_name', description: 'VCの名前'}]}
            ], value.id);
    });
    client.user.setPresence({activities:[{name:'now version 3.6.2'}]});
    client.channels.fetch('1008973466772439120')
    .then(channel => {
        channel.send('起動しました。\nversion 3.6.2');
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
            var omikuji_list = [
                ['大吉！', 'いいことあるかも！'],
                ['中吉！', 'いいじゃん！今日も頑張ろ！'],
                ['小吉','悪くはないよ！'],
                ['吉', '普通、、、かな？'],
                ['末吉', '(´・ω・｀)'],
                ['凶', 'まだまだ巻き返せる！'],
                ['鯖吉！', 'こりゃまた磯の匂いがしますなぁ\nところでさばちゃ副官おめでとう！'],
                ['しお吉！', '大当たりやなぁ！\n今日はいい日になるでぇー'],
                ['ヨル吉！', '頼れるヨルムや！\n今日は絶対いい事あります！'],
                ['すこ吉！', '面白いすこたろが出てきたなぁ\nあれ、ろたこすだったっけ？']
            ];
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
            await interaction.reply({content: '処理が終了しました', ephemeral: false});
            return;
        }
        if (interaction.commandName === 'test') {
            const connection = joinVoiceChannel({
                channelId: interaction.member.voice.channel.id,
                guildId: interaction.member.guild.id,
                adapterCreator: interaction.member.guild.voiceAdapterCreator
            });
            var player = createAudioPlayer();
            var res = createAudioResource(createReadStream(join(__dirname + '/test.mp3')), { inlineVolume: true });
            connection.subscribe(player);
            player.addListener('stateChange', (oldone, newone) => {
                if (newone.status === 'idle') {
                    connection.destroy();
                }
            });
            player.play(res);
            interaction.reply({content:'test finished',ephemeral:false});
            return;
        }
        if (interaction.commandName === 'pause') {
            if (players[interaction.guild.id] === undefined) {
                interaction.reply({content:'音楽を再生していません', ephemeral:false});
                return;
            }
            var result = players[interaction.guild.id].pause();
            if (!result) {
                interaction.reply({content:'失敗しました', ephemeral:false});
                return;
            }
            interaction.reply({content:'停止しました', ephemeral:false});
            return;
        }
        if (interaction.commandName === 'unpause') {
            if (players[interaction.guild.id] === undefined) {
                interaction.reply({content:'音楽を再生していません', ephemeral:false});
                return;
            }
            var result = players[interaction.guild.id].unpause();
            if (!result) {
                interaction.reply({content:'失敗しました', ephemeral:false});
                return;
            }
            interaction.reply({content:'再開しました', ephemeral:false});
            return;
        }
        if (interaction.commandName === 'youtube') {
            if (interaction.options.getString('youtube_url') === null) {
                var str = '';
                var count = 0;
                for (let i = 0;i<queue[interaction.guild.id].length;i++) {
                    count += 1;
                    if (count === 11) {
                        break;
                    }
                    str += 'https://www.youtube.com/watch?v=' + queue[interaction.guild.id][i] + '\n';
                }
                interaction.reply({content:str, ephemeral:false});
                return;
            }
            if (queue[interaction.guild.id] === undefined) {
                queue[interaction.guild.id] = [];
            }
            var URL = interaction.options.getString('youtube_url');
            var YOUTUBE_ID = getYouTubeID(URL, {fuzzy: false});
            if (YOUTUBE_ID === null) {
                interaction.reply({content: '追加しています', ephemeral: false});
                var playlistid = getYotubePlaylistId(URL)
                var playlist = await usetube.getPlaylistVideos(playlistid);
                await asy.each(playlist, async function (item) {
                    var _info = await yve.getVideoInfo(item.id);
                    if (_info.existing) {
                        queue[interaction.guild.id].push(item.id);
                    }
                });
            } else {
                queue[interaction.guild.id].push(YOUTUBE_ID);
                interaction.reply({content:'追加しました', ephemeral:false});
            }
            if (players[interaction.guild.id] === undefined) {
                const connection = joinVoiceChannel({
                    channelId: interaction.member.voice.channel.id,
                    guildId: interaction.member.guild.id,
                    adapterCreator: interaction.member.guild.voiceAdapterCreator
                });
                connections[interaction.guild.id] = connection;
                var player = createAudioPlayer();
                players[interaction.guild.id] = player;
                connection.subscribe(player);
                player.addListener('stateChange', async (oldone, newone) => {
                    if (newone.status === 'idle') {
                        fs.unlinkSync(__dirname + '/' + queue[interaction.guild.id][0] + '.mp3');
                        queue[interaction.guild.id] = queue[interaction.guild.id].slice(1);
                        if (queue[interaction.guild.id].length === 0) {
                            players[interaction.guild.id] = undefined;
                            queue[interaction.guild.id] = undefined;
                            connection.destroy();
                            return;
                        }
                        const BASE_URL = 'https://www.youtube.com/watch?v=';
                        var YOUTUBE_ID = queue[interaction.guild.id][0];
                        const url = `${BASE_URL}${YOUTUBE_ID}`;
                        const convertLinkToMp3 = youtubeMp3Converter(__dirname);
                        const pathToMp3 = convertLinkToMp3(url, {title:YOUTUBE_ID});
                        await setTimeout(function(){
                            var res = createAudioResource(createReadStream(__dirname + '/' + YOUTUBE_ID + '.mp3'), { inlineVolume: true });
                            res.volume.setVolume(0.3);
                            player.play(res);
                            interaction.channel.send('now play ' + url);
                        }, 5000);
                    }
                });
                const BASE_URL = 'https://www.youtube.com/watch?v=';
                var YOUTUBE_ID = queue[interaction.guild.id][0];
                const url = `${BASE_URL}${YOUTUBE_ID}`;
                const convertLinkToMp3 = youtubeMp3Converter(__dirname);
                const pathToMp3 = convertLinkToMp3(url, {title:YOUTUBE_ID});
                await setTimeout(function(){
                    var res = createAudioResource(createReadStream(__dirname + '/' + YOUTUBE_ID + '.mp3'), { inlineVolume: true });
                    res.volume.setVolume(0.3);
                    player.play(res);
                    interaction.channel.send('now play ' + url);
                }, 5000);
            }
            return;
        }
        if (interaction.commandName === 'skip') {
            if (players[interaction.guild.id] === undefined) {
                interaction.reply('音楽を再生していません');
                return;
            }
            interaction.reply({content:'スキップしました', ephemeral:false});
            players[interaction.guild.id].pause();
            fs.unlinkSync(__dirname + '/' + queue[interaction.guild.id][0] + '.mp3');
            queue[interaction.guild.id] = queue[interaction.guild.id].slice(1);
            if (queue[interaction.guild.id].length === 0) {
                players[interaction.guild.id] = undefined;
                queue[interaction.guild.id] = undefined;
                connections[interaction.guild.id].destroy();
                return;
            }
            const BASE_URL = 'https://www.youtube.com/watch?v=';
            var YOUTUBE_ID = queue[interaction.guild.id][0];
            const url = `${BASE_URL}${YOUTUBE_ID}`;
            const convertLinkToMp3 = youtubeMp3Converter(__dirname);
            const pathToMp3 = convertLinkToMp3(url, {title:YOUTUBE_ID});
            await setTimeout(function(){
                var res = createAudioResource(createReadStream(__dirname + '/' + YOUTUBE_ID + '.mp3'), { inlineVolume: true });
                res.volume.setVolume(0.3);
                players[interaction.guild.id].play(res);
                interaction.channel.send('now play ' + url);
            }, 5000);
        }
        if (interaction.commandName === 'rename_vc' && interaction.options.getString('vc_name') !== null) {
            if (interaction.member.voice.channel.id === '944787583836225556' || interaction.member.voice.channel.id === '927507376905551876' || interaction.member.voice.channel.id === '1010868113069330463') return;
            var name = interaction.options.getString('vc_name');
            interaction.member.voice.channel.edit({name: name});
            interaction.reply({content: '変更しました', ephemeral: false});
            return;
        }
    }
});

client.on('voiceStateUpdate', async (oldone, newone) => {
    if (oldone.channel === null && newone.channel !== null && newone.channel.id === '1010868113069330463') {
        var channel = await newone.guild.channels.create({
            name: newone.member.user.username + 'のチャンネル',
            type: ChannelType.GuildVoice
        });
        newone.member.voice.setChannel(channel);
    } else if (oldone.channel !== null && newone.channel === null && oldone.channel.id !== '927507376905551876' && oldone.channel.id !== '1010868113069330463' && oldone.channel.id !== '944787583836225556' && oldone.channel.members.size === 0) {
        oldone.channel.delete();
    }
});

client.login(token);
