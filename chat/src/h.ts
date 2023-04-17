import * as DiscordJS from 'discord.js';

import { IsMaintenance } from "../helpers/botStatus";
import { agents, InstanceFile, OwnerId } from "../utils/config";
import Database from "../database";

const { Worker } = require('node:worker_threads');

const ResponseQueue = new DiscordJS.Collection<string | number, any>();
const Cooldown = new DiscordJS.Collection<string | number, any>();
var Messages: any[] = [];

function AddToCooldown(id: string | number, timeout: number = 3600): void {
	Cooldown.set(id, null);
	
	setTimeout(() => {
		Cooldown.delete(id);
		Messages = Messages.filter((msg: any) => msg.author.id !== id);
	}, timeout)
}

export default async (message: any, client: any) => {
	if (message.author.bot) return;
	if (message.content.startsWith(message.prefix)) return;
	if ((await IsMaintenance(client)) && message.author.id !== OwnerId) return;
	
	if (message.guild) {
		var GuildData = await Database({
			collection: "chat",
			method: "find",
			query: { _id: message.guild.id }
		});
		
		if (!GuildData) return;
		if (GuildData.channel === null) return;
		
		var channel = message.guild.channels.cache.get(GuildData.channel);
		if (!channel) return await Database({
			collection: "chat",
			method: "update",
			query: { _id: message.guild.id },
			values: { $set: { channel: null } }
		});
		
		const checkPerms = channel.permissionsFor(client.user).missing(["VIEW_CHANNEL", "SEND_MESSAGES"]);
		
		if (checkPerms.length >= 1) return;
		if (message.channel.id !== channel.id) return;
	}
	
	var UserSession = client.sessions.get(message.author.id);
	let session: any;
	
	if (UserSession) {
		session = await Database({
			collection: "session",
			method: "find",
			query: { _id: UserSession }
		});
	} else {
		const UserAgent = agents[Math.floor(Math.random() * agents.length)];
		
		session = await Database({
			collection: "session",
			method: "create",
			values: {
				userId: message.author.id,
				userAgent: UserAgent,
				context: []
			}
		});
		
		client.sessions.set(message.author.id, session._id);
	}
	
	Messages.push(message);
	
	if (Cooldown.has(message.author.id)) {
		const this_user_message = Messages.filter((msg: any) => msg.author.id === message.author.id);
		
		if (this_user_message.length >= 3 && message.createdTimestamp - this_user_message[this_user_message.length - 2].createdTimestamp < 2500) {
			return message.reply({ content: "**WARNING:** Spamming is forbidden." });
		}
	} else {
		AddToCooldown(message.author.id);
		
		const worker = new Worker(InstanceFile, { workerData: { message: JSON.stringify(message), session: JSON.stringify(session) } });
		
		worker.on('message', (wmessage: any) => {
			wmessage = JSON.parse(wmessage);
			
			if (wmessage.t === "API_BANNED") SetMaintenance(client);
			else if (wmessage.t === "SESSION_ACK") handleSessionAck(client, wmessage);
			else return;
		});
		
		worker.on('exit', (exitCode: number) => {
			console.log(`[Worker Thread ${worker.threadId}] exited with code ${exitCode}`);
		});
	}
}

export async function SetMaintenance(client: any): Promise<void> {
	await Database({
		collection: "bot",
		method: "update",
		query: { id: client.user.id },
		values: {
			$set: {
				'status.api.is': "Down",
				'maintenance.i': true,
				'maintenance.t': "[OUTAGE] BackEnd API is down",
				'maintenance.d': "Brain Bot's backend API or its Chat Bot engine is currently down for some technical reason, It will be fixed asap. Thanks for your patience 🙏"
			},
			$push: {
				'status.api.history': {
					time: Date.now(),
					reason: "api banned"
				}
			}
		}
	});
}

export async function handleSessionAck(client: any, value: any): Promise<void> {
	await Database({
		collection: "session",
		method: "update",
		query: { _id: value.s._id },
		values: {
			$push: { context: {
				$each: [
					value.d.content,
					value.d.response
				]
			} }
		}
	})
	
	setTimeout(() => {
		Database({
			collection: "session",
			method: "find",
			query: { _id: value.s._id }
		}).then(async (newSes: any) => {
			var diff = Date.now() - new Date(new Date(newSes.lastMessage.createdTimestamp).toLocaleString()).getTime();
			
			if (diff >= 60000) {
				client.sessions.delete(newSes.userId)
				
				await Database({
					collection: "session",
					method: "delete",
					query: { _id: newSes._id }
				});
			}
		});
	}, 60000);
}
