const Database = require("better-sqlite3");
const db = new Database("levels.sqlite", {verbose: console.log});
const {xp} = require("./config.json");

var recent = {};

console.log(db.prepare("CREATE TABLE IF NOT EXISTS main.levels (" +
	"userid INTEGER PRIMARY KEY NOT NULL," +
	"messages INTEGER NOT NULL DEFAULT 0," +
	"experience INTEGER NOT NULL DEFAULT 0)"
).run());

function newUser(userid) {
	console.assert(userid);

	const statement = db.prepare("INSERT INTO main.levels VALUES ($userid, 0, 0)");

	console.log(statement.run({userid: userid}));
}

function newMessage(userid) {
	console.assert(userid);

	let new_xp = Math.floor(Math.random() * (xp.max - xp.min)) + xp.min;

	if (recent[userid]) {
		new_xp = 0;
	} else {
		recent[userid] = true;
		setTimeout(function() {
			delete recent[userid];
		}, xp.rate * 1000);
	}

	let statement = db.prepare("UPDATE main.levels SET " +
		"userid = $userid, " +
		"messages = messages + 1, " +
		"experience = experience + $new_xp " +
		"WHERE userid = $userid"
	);

	let result = statement.run({userid: userid, new_xp: new_xp});

	if (result.changes <= 0) {
		newUser(userid);
		newMessage(userid);
	}
}

function getRank(user) {
	console.assert(user);

	let statement = db.prepare(
		"SELECT messages, experience " +
		"FROM main.levels WHERE userid = $userid"
	);

	let success = statement.get({userid: user.id});

	if (!success || !success.experience)
		success = {experience: 0};

	return({
		"embed": {
			"color": 16099946,
			"thumbnail": {
				"url": `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}`
			},
			author: {
				"name": `Stats for ${user.username}`,
			},
			"description": `<:mese_shard:729887863776346173> ${success.experience} Mese shards.\n:bar_chart: Level 1337.`
		}
	});
}

module.exports = {
	newMessage,
	getRank,
}
