const Discord = require("discord.js");
const levels = require("./levels.js");
const config = require("./config.json");
const client = new Discord.Client();

client.once("ready", () => {
	console.log(`Logged in as ${client.user.tag}.`);
});

client.on("message", message => {
	if (message.author.bot)
		return;

	if (!message.content.startsWith(config.prefix)) {
		levels.newMessage(message.author.id);
		return;
	}

	const params = message.content.slice(config.prefix.length).split(" ");
	const command = params.shift().toLowerCase();

	if (command == "rank") {
		if (!params[0]) {
			message.channel.send(levels.getInfo(message.author));
		} else if (message.mentions.users.size > 0) {
			message.channel.send(levels.getInfo(message.channel.guild.members.cache.get(message.mentions.users.keys().next().value).user));
		} else {
			for (const member of message.channel.guild.members.cache) {
				if (member[1].user.username.toLowerCase().includes(params[0].toLowerCase())) {
					message.channel.send(levels.getInfo(member[1].user));
					return;
				}
			}

			message.channel.send(`No such user \"${params[0]}\"`);
		}
	} else if (command == "levels") {
		// message.reply(levels.getRanks());
	}
});

client.login(config.token);
