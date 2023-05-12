import { fetch, Response } from 'undici';

import {
	APIInteraction,
	ApplicationCommandOptionType,
	InteractionResponseType,
	PermissionFlagsBits,
	Routes
} from "../../typings";
import { DiscordAppId, ServerUrl } from "../../utils/config";
import { res } from "../../utils/res";
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
		stats(this.command as APIInteraction);
		return this.reply({
			type: InteractionResponseType.DeferredChannelMessageWithSource,
			data: {}
		});
	}
}

async function stats(interaction: APIInteraction): Promise<void>
{
	var guilds = await fetch(`${ServerUrl}/_guild/count`);
	var guilds_count = (await guilds.json() as {count: string})?.count?? "NaN";
	var conversation_count = "no one is currently talking to me."
	var message: string = `<:brainbot:992352663779946536> **Brain Bot** is an AI-Powered Discord Chat bot. I am in ${guilds_count} servers and ${conversation_count}`
	
	res.patch(Routes.webhookMessage(DiscordAppId, interaction?.token), {
		body: {
			content: message
		}
	});
}

export default Info;