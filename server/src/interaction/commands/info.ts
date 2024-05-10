import { fetch } from 'undici';

import { APIChatInputApplicationCommandInteraction, InteractionResponseType } from 'discord-api-types/v10';

import { ServerUrl } from "../../utils/config";
import Command from "./base";

import { InfoCommand } from "../../constants/commands.json";
import * as values from "../../constants/values.json";

class Info extends Command
{
	constructor(interaction: APIChatInputApplicationCommandInteraction)
	{
		super(interaction, InfoCommand);
	}
	
	async execute(): Promise<void>
	{
		var guilds = await fetch(`${ServerUrl}/__rntm/guild-count`);
		var conversations = await fetch(`${ServerUrl}/__rntm/session-count`);
		var guilds_count = 0;
		var conversation_count = 0;
		let no_one;

		if (guilds.ok)
		{
			const guildcount_json = await guilds.json() as { count: string; };
			guilds_count = Number(guildcount_json?.count ?? 0);
		}

		if (conversations.ok)
		{
			const convcount_json = await conversations.json() as { count: string; };
			conversation_count = Number(convcount_json?.count ?? 0);
			no_one = (Number(conversation_count) >= 1)? this.pretty(values.commands.info.chatting_with, String(conversation_count)): values.commands.info.no_one;
		}

		return this.reply({
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				content: this.pretty(values.commands.info.default_res + no_one, String(guilds_count))
			}
		});
	}
}

export default Info;