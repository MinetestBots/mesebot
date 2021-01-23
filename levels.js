const debug = false;

const Database = require("better-sqlite3");
const db = new Database("levels.sqlite", {verbose: debug && console.log || null});
const {getLevelRole, updateRoles} = require("./roles.js");
const config = require("./config.json");

const color = config.color || 1539327;
const cxp = config.xp || {};
const name = cxp.name || "XP";
const emoji = cxp.emoji || "";

var recent = {};

// Initial database creation
db.prepare("CREATE TABLE IF NOT EXISTS levels (" +
	"id TEXT PRIMARY KEY NOT NULL," +
	"xp INTEGER NOT NULL DEFAULT 0)"
).run();

// Current level based on xp
function getLevel(xp) {
	// Completely arbitrary roughly quadratic function
	return Math.max(0, Math.floor((-5 + Math.sqrt(5 * xp)) / 20));
}

// Get xp needed for a level
function getLevelXP(level) {
	return (((level * 20) + 5) ** 2) / 5;
}

const dbNewUser = db.prepare("INSERT INTO levels VALUES ($id, 0)");
function newUser(userID) {
	console.assert(userID);
	dbNewUser.run({id: userID});
}

// Give random xp to user
const dbUpdateXP = db.prepare("UPDATE levels SET xp = xp + $xp WHERE id = $id");
function updateXP(userID) {
	console.assert(userID);

	if (recent[userID]) return;

	recent[userID] = true;
	setTimeout(function() {
		delete recent[userID];
	}, (cxp.rate || 60) * 1000);

	const min = cxp.min || 3;
	const max = cxp.max || 5;
	let res = dbUpdateXP.run({id: userID, xp: Math.floor(Math.random() * (max - min)) + min});

	if (res.changes <= 0) {
		newUser(userID);
		recent[userID] = false; // Set to false so second update executes
		updateXP(userID);
	}
}

const dbGetXP = db.prepare("SELECT xp FROM levels WHERE id = $id");
function getXP(userID) {
	console.assert(userID);
	const res = dbGetXP.get({id: userID});
	return (res && res.xp) || 0;
}

// Do message updates
function newMessage(message) {
	const guildMember = message.guild.member(message.author);
	updateXP(guildMember.id);

	const level = getLevel(getXP(guildMember.id));
	if (updateRoles(guildMember, level) && config.reward_notify != false) {
		message.guild.roles.fetch(getLevelRole(level)).then((role) => {
			message.channel.send((config.reward_message || "$USER You have earned the $ROLE role.").replace("$ROLE", role.name).replace("$USER", `<@${guildMember.id}>`));
		});
	};
}

// Info embed
function getInfo(user) {
	console.assert(user);
	const xp = getXP(user.id);
	const level = getLevel(xp);

	return {
		"embed": {
			"color": color,
			"thumbnail": {
				"url": `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`
			},
			"title": `Stats for ${user.username}`,
			"description": `${emoji} ${xp} ${name}.\n:bar_chart: Level ${level}.\n:chart_with_upwards_trend: ${getLevelXP(level + 1) - xp} ${name} to next level.`
		}
	};
}

// Top 10 xp entries
const dbGetTop = db.prepare("SELECT id, xp FROM levels ORDER BY xp DESC LIMIT 10");
function getTop() {
	let embed = {
		"embed": {
			"color": color,
			"title": `${emoji} __Top 10 Members__ ${emoji}`,
			"fields": [
				{
					"name": name,
					"value": "",
					"inline": true
				},
				{
					"name": "Name",
					"value": "",
					"inline": true
				}
			]
		}
	};

	for (const entry of dbGetTop.all()) {
		embed.embed.fields[0].value += `${entry.xp.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}\n`;
		embed.embed.fields[1].value += `<@${entry.id}>\n`;
	}

	return embed;
}

module.exports = {
	newMessage,
	getInfo,
	getTop,
};
