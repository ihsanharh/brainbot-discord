const { parentPort, workerData } = require('node:worker_threads');
const superagent = require('superagent');

const { ServerUrl } = require("./constants.js");
const chatter = require("./modules/hash.js")

const { _channel, _guild, _message, _cooldown, _history, _session } = workerData;
const discordApi = "https://discord.com/api/v9";
const BotToken = "Bot "+process.env.BRAIN_BOTD_TOKEN;

var channel;
const message = JSON.parse(_message);
const cooldown = JSON.parse(_cooldown);
const history = JSON.parse(_history);
const session = JSON.parse(_session);

async function main()
{
	if (cooldown.includes(message.author.id))
	{
		let this_message_history = history.filter((msg) => msg.author.id === message.author.id);
		
		if (this_message_history.length > 3 && new Date(message.timestamp) - new Date(this_message_history[this_message_history.length - 2].timestamp) < 2500) {
			parentPort.postMessage({ i: "ban", d: message.author.id });
			await create_message(message?.channel_id, { content: "**WARNING:** Spamming is forbidden." });
		}
		
		return process.exit(0);
	}
	if (_guild) update_message_count(message.guild_id);
	if (responses.length >= 5) {
		parentPort.postMessage({ i: "reset_responses", d: message.guild_id });
		
		return process.exit(0);
	}
	
	parentPort.postMessage({ i: "add_cooldown", d: message.author.id });
	
	const content = message.content.replace(/brainbot|BrainBot|brain bot|Brain Bot/g, "cleverbot");
	
	context_push(message.content);
	chatter(message.author.name, content, session.ctx).then((msg) => {
		msg = msg.replace(/Clever Bot|CleverBot|clever bot|cleverbot/g, "brainbot");
		
		context_push(msg);
		trigger_typing(message?.channel_id)
		setTimeout(() => {
			create_message(message?.channel_id, {
				content: msg
			});
		}, 3100);
	}).catch((err) => {
		console.error(err);
		create_message(message.channel_id, {
			content: "```Oh no! Something went wrong. please try again in a few minutes.```"
		});
	});
}

async function context_push(m)
{
	parentPort.postMessage({ i: "context", d: {
		s_id: message.author.id,
		msg: m
	} });
}

async function create_message(channel_id, payload)
{
	try
	{
		const message_route = discordApi+"/channels/"+channel_id+"/messages";
		var channel;
		
		if (typeof channel === "string") channel = await superagent.get()
		if (channel.last_message_id !== message.id) Object.defineProperty(payload, "message_reference", {
			enumerable: true,
			value: {
				message_id: message.id
			}
		})
		
		Object.defineProperty(payload, "allowed_mentions", {
			enumerable: true,
			value: {
				parse: [],
				replied_user: false
			}
		})
		
		return await superagent.post(message_route)
		.set("Authorization", BotToken)
		.set("Content-Type", "application/json")
		.send(payload);
	}
	catch (e)
	{
		console.error(e);
	}
}

async function trigger_typing(channel_id)
{
	try
	{
		superagent.post(discordApi+"/channels/"+channel_id+"/typing")
		.set("Authorization", BotToken)
		.end((err, res) => {
			console.log(res);
		});
	}
	catch (e)
	{
		console.log(e);
	}
}

async function update_message_count(guild_id)
{
	try
	{
		superagent.patch(ServerUrl+"/database/guild/"+guild_id)
		.set("Authorization", process.env.SERVER_RSA)
		.set("Content-Type", "application/json")
		.send({ $inc: { count: 1 } })
		.end();
	}
	catch(e)
	{
		return null;
	}
}

main();