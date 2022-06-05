import Command from "../base/Command";

export default class PingCommand extends Command {
	constructor(client: any) {
		super(client, {
			name: "ping",
			description: "Ping pong!",
			permission: {
				author: ["OWNER"],
				me: []
			},
			usages: [],
			options: []
		})
	}
	
	async execute(): Promise<any> {
		return this.reply({ content: "pong" });
	}
}
