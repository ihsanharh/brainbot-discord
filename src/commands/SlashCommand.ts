import Command from "../base/Command";

export default class SlashCommand extends Command {
	constructor(client: any) {
		super(client, {
			name: "slash",
			description: "Slash Commands Manager",
			permission: {
				author: ["OWNER"],
				me: []
			},
			usages: [],
			options: [
				{
					type: 3,
					name: "action",
					description: "action to do",
					required: true,
					choices: [
						{
							name: "register",
							value: "registe"
						},
						{
							name: "reset",
							value: "reset"
						}
					]
				}
			]
		})
	}
	
	async execute(): Promise<any> {
		if (this.slash) await this.command.deferReply();
		
		const ActionToDo = (await this.args({ name: "action" }))[0];
		const clientCommands = this.client.commands.filter((c: any) => !c.permission.author.includes("OWNER"));
		
		if (ActionToDo === "register") {
			try {
				this.client.guilds.cache.forEach((Guild: any) => {
					Guild.commands.set(clientCommands).then((RegisteredCommands: any) => {
						return this.reply({ content: `registered ${RegisteredCommands.size} commands to **${Guild.name}**` })
					})
				});
			} catch(error: any) {
				throw error;
			}
		} else if (ActionToDo === "reset") {
			this.client.guilds.cache.forEach((Guild: any) => {
				Guild.commands.set([]).then(() => {
					this.reply({ content: `removed all commands from **${Guild.name}**` })
				})
			});
		} else {
			return this.reply({ content: "Please specify the action! ` register ` or ` reset `" })
		}
	}
}
