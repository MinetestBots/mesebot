const Discord = require("discord.js");
const client = new Discord.Client();

const roles = require ("./roles.js");
const levels = require("./levels.js");
const config = require("./config.json");

// Sleep function taken from StackOverflow
// https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

Discord.TextChannel.prototype.typeMessage = 
  async function (message) {
    this.startTyping();
    await sleep(3000);
    this.stopTyping();

    this.send(message);
}

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}.`);
});

// Register commands as object for easy aliasing
const commands = new (function() {
    this.rank = (message, params) => {
        if (!params[0]) { // Self info
            message.channel.typeMessage(levels.getInfo(message.author))
        } else if (message.mentions.users.size > 0) { // Mentioned user
            message.channel.typeMessage(levels.getInfo(message.mentions.users.first()));
        } else { // Named user
            const members = message.channel.guild.members;

            // Find by nick or username
            members.fetch({query: params[0], limit: 1}).then(member => {
                if (member.first()) {
                    message.channel.typeMessage(levels.getInfo(member.first().user));
                    return;
                }

                // Find by UUID
                if (params[0].match(/\d{18}/)) {
                    if (levels.getUser(params[0]).rank > 0) {
                        client.users.fetch(params[0]).then(user => {
                            message.channel.typeMessage(levels.getInfo(user));
                        });
                        return;
                    }
                }

                message.channel.typeMessage(`Could not find user or ID \"${params[0]}\".`);
            });
        }
    }
    this.level = this.rank;

    this.levels = (message) => {
        message.channel.typeMessage(levels.getTop());
    }
    this.top = this.levels;

    this.help = (message) => {
        let c;
        message.channel.typeMessage({
            "embed": {
                "color": config.color,
                "thumbnail": {
                    "url": client.user.avatarURL(),
                },
                "title": "MeseBot Info",
                "description": `Minetest-themed levelling bot.\nPrefix: \`${config.prefix}\``,
                "fields": [
                    {
                        "name": "Commands",
                        "value": Object.entries(commands).map(e => {const s = `${c && e[1] == c ? `, ` : "\n"}\`${e[0]}\``; c = e[1]; return s;}).join("").slice(1),
                        "inline": true
                    },
                    {
                        "name": "Rank Rewards",
                        "value": (config.role_rewards || []).sort((a, b) => a[0] - b[0]).map(e => `${e[0]}: <@&${e[1]}>`).join("\n"),
                        "inline": true
                    },
                    {
                        "name": "Source code",
                        "value": "https://github.com/MinetestBots/mesebot"
                    }
                ]
            }
        });
    }
    this.info = this.help;
});

client.on("message", message => {
    if (message.author.bot)	return;
    let mention = `<@!${client.user.id}> `;

    // Do user updating
    if (!message.content.startsWith(config.prefix) && !message.content.startsWith(mention)) {
        levels.newMessage(message);
        return;
    }

    // Check for command
    const prefix = message.content.startsWith(config.prefix) ? config.prefix : mention;
    const params = message.content.slice(prefix.length).split(" ");
    const command = params.shift().toLowerCase();
    if (commands[command]) commands[command](message, params);
});

client.on("guildMemberAdd", member => {
    roles.updateRoles(member, levels.getUser(member.id).level);
});

client.login(config.token);
