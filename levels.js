const Database = require("better-sqlite3");
const db = new Database("levels.sqlite", {verbose: console.log});
const {xp} = require("./config.json");
const updateRoles = require("./roles.js");

var recent = {};

// Initial database creation
console.log(db.prepare("CREATE TABLE IF NOT EXISTS levels (" +
	"id TEXT PRIMARY KEY NOT NULL," +
	"xp INTEGER NOT NULL DEFAULT 0)"
).run());

// Current level based on xp
function getLevel(xp) {
	return Math.max(0, Math.floor((-5 + Math.sqrt(5 * xp)) / 10));
}

const dbNewUser = db.prepare("INSERT INTO levels VALUES ($id, 0)");
function newUser(userID) {
	console.assert(userID);
	console.log(dbNewUser.run({id: userID}));
}

// Give random xp to user
const dbUpdateXP = db.prepare("UPDATE levels SET xp = xp + $xp WHERE id = $id");
function updateXP(userID) {
	console.assert(userID);

	if (recent[userID]) return;

	recent[userID] = true;
	setTimeout(function() {
		delete recent[userID];
	}, xp.rate * 1000);

	let res = dbUpdateXP.run({id: userID, xp: Math.floor(Math.random() * (xp.max - xp.min)) + xp.min});

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
function newMessage(guildMember) {
	updateXP(guildMember.id);
	updateRoles(guildMember, getLevel(getXP(guildMember.id)));
}

const emote = ":mese_shard:729887863776346173";

// Info embed
function getInfo(user) {
	console.assert(user);
	const xp = getXP(user.id);

	return({
		"embed": {
			"color": 16099946,
			"thumbnail": {
				"url": `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`
			},
			"title": `Stats for ${user.username}`,
			"description": `<${emote}> ${xp} Mese shards.\n:bar_chart: Level ${getLevel(xp)}.`
		}
	});
}

// Top 10 xp entries
const dbGetTop = db.prepare("SELECT id, xp FROM levels ORDER BY xp DESC LIMIT 10");
function getTop() {
	let embed = {
		"embed": {
			"color": 16099946,
			"title": `<${emote}> __Top 10 Members__ <${emote}>`,
			"fields": [
				{
					"name": "Shards",
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
