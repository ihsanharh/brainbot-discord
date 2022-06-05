import ms = require('ms');

import { countdown } from "../utils";
import Command from "../base/Command";
import Database from "../database";

export default class StatusCommand extends Command {
	constructor(client: any) {
		super(client, {
			name: "status",
			description: "Display bot status",
			permission: {
				author: [],
				me: []
			},
			usages: [],
			options: []
		})
	}
	
	async execute(): Promise<any> {
		var BotStatus: any = {
			ping: this.client.ws.ping,
			uptime: countdown(Number((this.client.uptime / 1000).toFixed(0))),
			proxy: {
				live: (await Database({
					collection: "proxy",
					method: "find",
					unlimited: true,
					query: { available: true }
				})).length,
				dead: 0
			}
		}
		
		var MeEmbed: any = {
			title: `All Systems Operational`,
			color: this.colors["green.Status"],
			fields: [
				{
					name: "API",
					value: `Operational`
				},
				{
					name: "DATABASE",
					value: `Operational`
				},
				{
					name: "HOSTING",
					value: `Operational`
				},
				{
					name: "BOT",
					value: `\`\`\`js\nPing   :: ${BotStatus.ping} ms\nUptime :: ${BotStatus.uptime}\n\`\`\``
				},
				{
					name: "PROXY",
					value: `\`\`\`js\nLive :: ${BotStatus.proxy.live}\nDead :: ${BotStatus.proxy.dead}\`\`\``
				}
			]
		}
		
		return this.reply({
			embeds: [MeEmbed]
		});
	}
}
