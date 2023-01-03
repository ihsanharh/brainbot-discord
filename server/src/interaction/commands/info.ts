import { fetch, Response } from 'undici';

import {
	ApplicationCommandOptionType,
	InteractionResponseType,
	PermissionFlagsBits
} from "../../typings";
import { ServerUrl } from "../../utils/config";
import Command from "./base";

const InfoCommand = {
	name: "info",
	name_localizations: {},
	description: "Get information and statistics about this bot.",
	description_localizations: {},
	options: [],
	default_member_permissions: String(PermissionFlagsBits.UseApplicationCommands),
	dm_permission: false
}

class Info extends Command
{
	constructor()
	{
		super(InfoCommand);
	}
	
	async execute(): Promise<void>
	{
		var server_count = await fetch(`${ServerUrl}/_guild/count`);
		
		var message: string = `**Brain Bot** is an AI-Powered Discord Chat bot. I am in ${(await server_count.json() as {count: string}).count ?? "NaN"} servers`;
		
		return this.reply({
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				content: message
			}
		});
	}
}

export default Info;