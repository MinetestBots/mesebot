const Discord = require("discord.js");
const client = new Discord.Client();

const levels = require("./levels.js");
const config = require("./config.json");

client.once("ready", () => {
	console.log(`Logged in as ${client.user.tag}.`);
});

client.on("message", message => {
	if (message.author.bot)
		return;

	// Do updating
	if (!message.content.startsWith(config.prefix)) {
		levels.newMessage(message.guild.member(message.author));
		return;
	}

	// Check for commands
	const params = message.content.slice(config.prefix.length).split(" ");
	const command = params.shift().toLowerCase();

	if (command == "rank") {
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
	} else if (command == "levels") {
		message.channel.send(levels.getTop());
	}
});

client.login(config.token);
