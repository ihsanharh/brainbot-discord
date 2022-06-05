import Command from "../base/Command";

export default class SlashCommand extends Command {
	constructor(client: any) {
		super(client, {
			name: "slash",
			description: "register slash command",
			permission: {
				author: ["OWNER"],
				me: []
			},
			usages: [],
			options: []
		})
	}
	
	async execute(): Promise<any> {
		const commands = this.client.commands
		
		await this.command.guild.commands.set(commands);
		
		return this.reply({ content: "done!" })
	}
}
