import { CommandHandler } from "../../base/Command";
import { DefaultPrefix } from "../../utils";
import Database from "../../database";

export default async (message: any, client: any) => {
	let ChatData;
	if (message.guild) ChatData = await Database({
		collection: "chat",
		method: "find",
		query: { _id: message.guild.id }
	});
	
	const prefix: string | any = ChatData ? ChatData?.prefix : DefaultPrefix;
	
	if (message.content.startsWith(prefix)) {
		message.args = message.content.slice(prefix.length).trim().split(/ +/g);
		const command_name = message.args.shift().toLowerCase();
		
		Object.defineProperties(message, {
			commandName: {
				value: command_name,
				writable: false
			},
			prefix: {
				value: prefix,
				writable: false
			}
		});
		
		return CommandHandler(message, client);
	}
}
