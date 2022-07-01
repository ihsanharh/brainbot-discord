import { InstanceFile } from "../utils/config";
import * as Discord from 'discord.js';

import { agents } from "../utils/config";
import Database from "../database";

const { Worker } = require('node:worker_threads');

const Cooldown = new Discord.Collection<string | number, any>();

function AddToCooldown(id: string | number, timeout: number = 3600): void {
	Cooldown.set(id, null);
	
	setTimeout(() => {
		Cooldown.delete(id);
	}, timeout)
}

export default async (message: any, client: any) => {
	if (message.author.bot) return;
	if (message.content.startsWith(message.prefix)) return;
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
		const GetAvailableProxy = await Database({
			collection: "proxy",
			method: "find",
			query: { available: true },
			unlimited: true
		});
		
		if (GetAvailableProxy.length < 1) return message.reply({ content: "Please wait a few minutes before you can talk to me." });
		
		const UserAgent = agents[Math.floor(Math.random() * agents.length)];
		const UProxy = GetAvailableProxy[0];
		
		await Database({
			collection: "proxy",
			method: "update",
			query: { _id: UProxy._id },
			values: {
				$set: { available: false }
			}
		});
		
		session = await Database({
			collection: "session",
			method: "create",
			values: {
				userId: message.author.id,
				proxyId: UProxy._id,
				proxy: `http://${UProxy.auth.user}:${UProxy.auth.password}@${UProxy["ip_address"]}:${UProxy.port}`,
				userAgent: UserAgent,
				context: []
			}
		});
		
		client.sessions.set(message.author.id, session._id);
	}
	
	if (Cooldown.has(message.author.id)) return;
	else AddToCooldown(message.author.id);
	
	const worker = new Worker(InstanceFile, { workerData: { message: JSON.stringify(message), session: JSON.stringify(session) } });
	
	worker.on('message', (wmessage: any) => {
		wmessage = JSON.parse(wmessage);
		
		if (wmessage.t === "LAST_MESSAGE_UPDATE") handleLastMessageUpdate(wmessage);
		if (wmessage.t === "SESSION_ACK") handleSessionAck(client, wmessage);
	});
	
	worker.on('exit', (exitCode: number) => {
		console.log(`[Worker Thread ${worker.threadId}] exited with code ${exitCode}`);
	});
}

export async function handleLastMessageUpdate(value: any): Promise<void> {
	await Database({
		collection: "session",
		method: "update",
		query: { _id: value.s._id },
		values: {
			$set: { lastMessage: value.d }
		}
	})
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
			
			if (diff > 60000) {
				client.sessions.delete(newSes.userId)
				
				await Database({
					collection: "proxy",
					method: "update",
					query: { _id: value.s.proxyId },
					values: {
						$set: { available: true }
					}
				})
			}
		})
	}, 60000)
}
