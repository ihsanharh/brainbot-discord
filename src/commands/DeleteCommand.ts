import Command from "../base/Command";
import Database from "../database";

export default class DeleteCommand extends Command {
	constructor(client: any) {
		super(client, {
			name: "delete",
			description: "delete the bot configurations, including stored messages.",
			permission: {
				author: ["MANAGE_GUILD"],
				me: []
			},
			usages: [],
			options: []
		});
	}
	
	async execute() {
		if (this.slash) await this.command.deferReply();
		
		const checkDatabase = await Database({
			collection: "chat",
			method: "find",
			query: { _id: this.command.guild.id }
		});
		
		if (checkDatabase && checkDatabase.channel !== null) {
			await Database({
				collection: "chat",
				method: "update",
				query: { _id: this.command.guild.id },
				values: { $set: { channel: null } }
			});
			
			return this.reply({
				content: `${this.emojis.xmark} Fine! I won't respond in <#${checkDatabase.channel}> anymore.`
			})
		} else if (!checkDatabase || checkDatabase && checkDatabase.channel === null) {
			return this.reply({ content: `${this.emojis.info} It seems like i have never used here. Use \` ${this.command.prefix}setup \` to start.` })
		}
	}
}
