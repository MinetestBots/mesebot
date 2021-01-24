const debug = false;

const Database = require("better-sqlite3");
const db = new Database("levels.sqlite", {verbose: debug && console.log || null});
const {getLevelRole, updateRoles} = require("./roles.js");
const config = require("./config.json");

const color = config.color || 1539327;
const cxp = config.xp || {};
const name = cxp.name || "XP";
const emoji = cxp.emoji || "";

let recent = {};

// Initial database creation
db.prepare(`CREATE TABLE IF NOT EXISTS levels (
	id TEXT PRIMARY KEY NOT NULL,
	xp INTEGER NOT NULL DEFAULT 0,
	level INTEGER NOT NULL DEFAULT 0);`).run();

// Get xp needed for a level
function getLevelXP(level) {
	return 5 / 6 * level * (2 * level * level + 27 * level + 91); // Abducted from https://github.com/PsKramer/mee6calc/blob/master/calc.js
}

const dbNewUser = db.prepare("INSERT INTO levels VALUES ($id, 0, 0)");
function newUser(user_id) {
	console.assert(user_id);
	dbNewUser.run({id: user_id});
}

const dbUpdateUser = db.prepare("UPDATE levels SET xp = $xp, level = $level WHERE id = $id");
function updateUser(user_id, xp, level) {
	console.assert(user_id);

	if (dbUpdateUser.run({id: user_id, xp: xp, level: level}).changes <= 0) {
		newUser(user_id);
		updateUser(user_id, xp, level);
	}
}

const dbGetUser = db.prepare("SELECT xp, level FROM levels WHERE id = $id");
function getUser(user_id) {
	console.assert(user_id);
	return dbGetUser.get({id: user_id});
}

// Do message updates
function newMessage(message) {
	const user_id = message.author.id;

	if (recent[user_id]) return;
	recent[user_id] = true;

	setTimeout(() => {
		delete recent[user_id];
	}, (cxp.rate || 60) * 1000);

	// Add random xp and check current data for levelup
	const data = getUser(user_id);
	const min = cxp.min || 15;
	const max = cxp.max || 25;
	const xp = data.xp + Math.floor(Math.random() * (max - min)) + min;
	const level = xp >= getLevelXP(data.level + 1) ? data.level + 1 : data.level;

	updateUser(user_id, xp, level);

	if (updateRoles(message.guild.member(message.author), level) && config.reward_notify != false) {
		message.guild.roles.fetch(getLevelRole(level)).then((role) => {
			message.channel.send((config.reward_message || "$USER You have earned the $ROLE role.").replace("$ROLE", role.name).replace("$USER", `<@${user_id}>`));
		});
	};
}

// Info embed
function getInfo(user) {
	console.assert(user);
	const data = getUser(user.id)

	return {
		"embed": {
			"color": color,
			"thumbnail": {
				"url": `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`
			},
			"title": `Stats for ${user.username}`,
			"description": `${emoji} ${data.xp} ${name}.\n:bar_chart: Level ${data.level}.\n:chart_with_upwards_trend: ${getLevelXP(data.level + 1) - data.xp} ${name} to next level.`
		}
	};
}

// Top 10 xp entries
const dbGetTop = db.prepare("SELECT id, xp, level FROM levels ORDER BY xp DESC LIMIT 10");
function getTop() {
	let embed = {
		"embed": {
			"color": color,
			"title": `${emoji} __Top 10 Members__ ${emoji}`,
			"fields": [
				{
					"name": "Name",
					"value": "",
					"inline": true
				},
				{
					"name": name,
					"value": "",
					"inline": true
				},
				{
					"name": "Level",
					"value": "",
					"inline": true
				},
			]
		}
	};

	for (const entry of dbGetTop.all()) {
		embed.embed.fields[0].value += `<@${entry.id}>\n`;
		embed.embed.fields[1].value += `${entry.xp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}\n`; // Regex adds commas
		embed.embed.fields[2].value += `${entry.level}\n`;
	}

	return embed;
}

module.exports = {
	newMessage,
	getInfo,
	getTop,
};
