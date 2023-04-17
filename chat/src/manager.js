const { Worker } = require('node:worker_threads');
const superagent = require('superagent');

const { ServerUrl } = require("./constants.js");
const Blacklist = require("./modules/blacklist.js");
const GuildRecord = require("./modules/guild.js");

const Cooldown = new Map();
const Sessions = new Map();
const Spams = [];
const message_history = [];

async function Manager(message)
{
	var guild_data;
	var this_channel;
	var session;
	
	if (await Blacklist._has(message.author.id)) return;
	if (message.author?.bot || message.author?.system) return;
	if (message.author.id !== "591416431598632980") return;
	if (message.guild_id) {
		if (await Blacklist._has(message.guild_id)) return;
		
		guild_data = await GuildRecord._get(message.guild_id);
		
		if (!guild_data) return;
		if (message.channel_id !== guild_data["channel"]) return;
		
		const guild_channels = await GuildRecord._channels(message.guild_id);
		this_channel = guild_channels?.filter((channel) => channel.id === guild_data?.channel)[0];
		const view_n_send_p = BigInt(1 << 10) | BigInt(1 << 11);
		
		if (!(BigInt(this_channel["req_user_permissions"]["allow"]) & view_n_send_p) == view_n_send_p) return;
	}
	
	if (Sessions.has(message.author.id))
	{
		session = Sessions.get(message.author.id);
	}
	else
	{
		//const UserAgent = agents[Math.floor(Math.random() * agents.length)];
		session = {
			userId: message.author.id,
			//agent: UserAgent,
			context: []
		}
		
		/*superagent.post(ServerUrl+"/_sessions")
		.set("Authorization", process.env.SERVER_RSA)
		.set("Content-Type", "application/json")
		.send(session)
		.end();*/
		
		Sessions.set(session.userId, session);
	}
	
	message_history.push(message);
	console.log(message)
	const Thread = new Worker(__dirname+"/chat.js", {
		workerData: {
			_channel: JSON.stringify(this_channel),
			_guild: guild_data ? true : false,
			_message: JSON.stringify(message),
			_cooldown: JSON.stringify(Array.from(Cooldown.keys())),
			_history: JSON.stringify(message_history),
			_session: JSON.stringify(session)
		}
	});
	
	Thread.on("message", (msg) => {
		if (msg["i"] === "add_cooldown") addToCooldown(msg["d"]);
		else if (msg["i"] === "ack") SessionAck(msg["d"]["s_id"], msg["d"]["msg"]);
		else if (msg["i"] === "ban") {
			if (Spams.filter((id) => id === msg["d"]).length >= 3) _create(msg["d"], "USER");
			else Spams.push(msg["d"]);
		}
	});
}

async function addToCooldown(id, timeout = 3000)
{
	Cooldown.set(id);
	
	setTimeout(() => {
		Cooldown.delete(id);
	}, timeout);
}

async function SessionAck(s_id, msg)
{
	if (Sessions.has(s_id))
	{
		const this_session = Sessions.get(s_id);
		
		Responses.set(s_id, {
			ctx: [...this_session.ctx, msg]
		});
	}
	else
	{
		Sessions.set(s_id, {
			ctx: [msg]
		});
	}
}

module.exports = Manager;