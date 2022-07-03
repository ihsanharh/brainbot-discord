import { CommandHandler } from "../../base/Command";
import { DefaultPrefix, OwnerId } from "../../utils";
import Database from "../../database";
import InstanceManager from "../../instance/InstanceManager";
import BlacklistManager from "../../helpers/BlacklistManager";

export default async (message: any, client: any) => {
	if (process.env.BS === "DEV") {
		if (message.author.id !== OwnerId) return;
	}
	const isBlacklisted = await BlacklistManager(message);
	if (isBlacklisted === true) return;
	
	var ChatData;
	if (message.guild) ChatData = await Database({
		collection: "chat",
		method: "find",
		query: { _id: message.guild.id }
	});
	
	const prefix: string | any = ChatData ? ChatData?.prefix : DefaultPrefix;
	
	Object.defineProperty(message, "prefix", {
		value: prefix,
		writable: false
	});
	
	//InstanceManager(message, client);
	
	if (message.content.startsWith(prefix)) {
		message.args = message.content.slice(prefix.length).trim().split(/ +/g);
		const command_name = message.args.shift().toLowerCase();
		
		Object.defineProperty(message, "commandName", {
			value: command_name,
			writable: false
		});
		
		return CommandHandler(message, client);
	}
}
