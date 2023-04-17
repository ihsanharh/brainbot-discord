import { fetch, Response } from 'undici';

import {
	ApplicationCommandOptionType,
	HttpStatusCode,
	InteractionResponseType,
	PermissionFlagsBits
} from "../../typings";
import { Chat } from "../../schemas/chat";
import { Rsa, ServerUrl } from "../../utils/config";
import Command from "./base";

const DeleteCommand = {
	name: "delete",
	name_localizations: {},
	description: "Delete bot configuration and prune stored messages.",
	description_localizations: {},
	options: [],
	default_member_permissions: String(PermissionFlagsBits.UseApplicationCommands | PermissionFlagsBits.ManageGuild),
	dm_permission: false
}

class Delete extends Command
{
	constructor()
	{
		super(DeleteCommand);
	}
	
	async execute(): Promise<void>
	{
		const get_guild_data = await fetch(`${ServerUrl}/database/guild/${this.command.guild_id}`, {
			method: "GET",
			headers: {
				"Accept": "application/json",
				"Authorization": Rsa
			}
		}) as Response;
		const json_guild_data = await get_guild_data.json() as Chat|any;
		
		if (get_guild_data.ok && json_guild_data.channel !== null)
		{
			fetch(`${ServerUrl}/database/guild/${this.command.guild_id}`, {
				method: "PATCH",
				headers: {
					"Authorization": Rsa,
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					$set: {
						channel: null
					}
				})
			});
			
			return this.reply({
				type: InteractionResponseType.ChannelMessageWithSource,
				data: {
					content: `❌ Fine! i won't talk in <#${json_guild_data.channel}> anymore.`
				}
			});
		}
		else if (get_guild_data.status === HttpStatusCode.NOT_FOUND || get_guild_data.ok && json_guild_data.channel === null)
		{
			return this.reply({
				type: InteractionResponseType.ChannelMessageWithSource,
				data: {
					content: `It seems like i have never been used here before. Use /setup to start.`
				}
			});
		}
	}
}

export default Delete;