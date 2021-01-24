const Discord = require("discord.js");
const client = new Discord.Client();

const levels = require("./levels.js");
const {prefix, token} = require("./config.json");

client.once("ready", () => {
	console.log(`Logged in as ${client.user.tag}.`);
});

// Register commands as object for easy aliasing
const commands = new (function() {
	this.rank = (message, params) => {
		if (!params[0]) { // Self info
			message.channel.send(levels.getInfo(message.author));
		} else if (message.mentions.users.size > 0) { // Mentioned user
			message.channel.send(levels.getInfo(message.channel.guild.members.cache.get(message.mentions.users.keys().next().value).user));
		} else { // Named user
			for (const member of message.channel.guild.members.cache) {
				if (member[1].user.username.toLowerCase().includes(params[0].toLowerCase())) {
					message.channel.send(levels.getInfo(member[1].user));
					return;
				}
			}

			message.channel.send(`Could not find user \"${params[0]}\".`);
		}
	}
	this.level = this.rank;

	this.levels = (message) => {
		message.channel.send(levels.getTop());
	}
	this.top = this.levels;
});

client.on("message", message => {
	if (message.author.bot)	return;

	// Do user updating
	if (!message.content.startsWith(prefix)) {
		levels.newMessage(message);
		return;
	}

	// Check for command
	const params = message.content.slice(prefix.length).split(" ");
	const command = params.shift().toLowerCase();
	if (commands[command]) commands[command](message, params);
});

client.login(token);
