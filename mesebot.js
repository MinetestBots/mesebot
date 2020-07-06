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
		levels.newMessage(message.author.id, message.author.username);
		return;
	}

	const params = message.content.slice(config.prefix.length).split(" ");
	const command = params.shift().toLowerCase();

	if (command == "rank") {
		if (!params[0]) {
			message.channel.send(levels.getRank(message.author.id));
		} else {
			// Todo
		}
	} else if (command == "levels") {
		// message.reply(levels.getRanks());
	}
});

client.login(config.token);
