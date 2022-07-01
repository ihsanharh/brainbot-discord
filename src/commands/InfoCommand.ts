import Command from "../base/Command";

export default class InfoCommand extends Command {
	constructor(client: any) {
		super(client, {
			name: "info",
			description: "Get information and statistic about this bot.",
			permission: {
				author: [],
				me: ["VIEW_CHANNEL", "SEND_MESSAGES"]
			},
			usages: []
		})
	}
	
	async execute() {
		var guildsCount = (await this.client.shard.fetchClientValues("guilds.cache.size")).reduce((prev: any, val: any) => prev + val, 0);
		var message = `${this.emojis["BrainBot"]} **${this.client.user.username}** is a AI-Powered Discord chat bot.\nI am in **${guildsCount}** guilds`;
		
		if (this.client.sessions.size >= 1) message += ` and currently talking to ${this.client.sessions.size} people.`;
		else message += ` and no one is talking to me right now:(`;
		
		message += `\n\nThis server is on Shard ${this.client.shard.ids[0]} with ${this.client.ws.ping} milliseconds of latency.`;
		
		return this.reply({ content: message });
	}
}
