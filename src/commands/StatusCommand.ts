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
		if (this.slash) await this.command.deferReply();
		
		var BotStatus: any = {
			ping: this.client.ws.ping,
			uptime: countdown(Number((this.client.uptime / 1000).toFixed(0))),
			proxy: {
				live: (await Database({
					collection: "proxy",
					method: "find",
					unlimited: true,
					query: { banned: false }
				})).length,
				dead: (await Database({
					collection: "proxy",
					method: "find",
					unlimited: true,
					query: { banned: true }
				})).length
			}
		}
		
		const Ping = BotStatus.ping
		let PingColor;
		
		if (Ping <= 149) {
			PingColor = this.colors["green.Status"]
		} else if (Ping >= 150 && Ping <= 299) {
			PingColor = this.colors["yellow.Status"]
		} else {
			PingColor = this.colors["red.Status"]
		}
		
		var MeEmbed: any = {
			title: `All Systems Operational`,
			color: PingColor,
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