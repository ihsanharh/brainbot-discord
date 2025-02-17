import { fetch } from 'undici';
import { workerData } from 'node:worker_threads';
import * as path from 'path';

import { InteractionResponseType, InteractionType, MessageFlags, Routes } from 'discord-api-types/v10';
import { CollectorData, } from "../typings";

import { respond } from "./commands/base";
import { DiscordCommandChannel, Rsa, ServerUrl } from "../utils/config";
import { res } from "../utils/res";
import logger from "../services/logger";

async function main(): Promise<void>
{
	const { collectors, interaction, commands } = workerData;
	
	if (interaction?.type === InteractionType.ApplicationCommand)
	{
		let author = interaction?.user ?? interaction?.member?.user;
		let when: string = `<t:${Math.floor(Date.now()/1000)}:R>`;
		
		try
		{
			var this_command = new (await import(`./commands/${interaction?.data?.name}.js`)).default(interaction);
			
			command_logger(`${when} **${author.username}#${author.discriminator}** used </${interaction?.data['name']}:${interaction?.data['id']}>`);
			return await this_command.props(commands);
		}
		catch(error: unknown)
		{
			logger.error(error);
			command_logger(`${when} **${author.username}#${author.discriminator}** encountered an error while using </${interaction?.data['name']}:${interaction?.data['id']}>`);
			return respond(interaction, {
				type: InteractionResponseType.ChannelMessageWithSource,
				data: {
					content: `Something went wrong`,
					flags: MessageFlags.Ephemeral
				}
			});
		}
	}
	else if (interaction?.type === InteractionType.MessageComponent)
	{
		const customId = interaction?.data['custom_id'];
		const collectorState: string = customId.substring(customId.lastIndexOf(".")).substring(1);
		const get_collector = collectors.get("clr0" + collectorState);

		if (get_collector)
		{
			const isCollector: CollectorData = JSON.parse(get_collector);
			
			if (isCollector && isCollector.component_types && isCollector.component_types?.includes(interaction.data["component_type"]) && isCollector.component_ids && isCollector?.component_ids.includes(interaction?.data['custom_id']))
			{
				logger.info(`[Collector] ${isCollector.id} collected interaction: ${interaction.id}.`);
				if (isCollector.expand_on_click) logger.info(`[Collector] ${isCollector.id} expanded.`);

				const pwd = path.resolve(isCollector.pwd, isCollector.filename);
				const FiletoExec = await import(pwd);

				if (FiletoExec && FiletoExec._collectorCollect) FiletoExec._collectorCollect(isCollector, interaction, commands);

				fetch(`${ServerUrl}/_collector/collect`, {
					method: "POST",
					headers: {
						"Accept": "application/json",
						"Authorization": Rsa,
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						interaction: JSON.stringify(interaction),
						data: JSON.stringify(isCollector)
					})
				});
			}
	    }
		else
		{
			return respond(interaction, {
				type: InteractionResponseType.UpdateMessage,
				data: {}
			});
		}
	}
	else if (interaction.type === InteractionType.ModalSubmit)
	{
		if (interaction.data.custom_id === "SuggestAFeature.Modal")
		{
			return respond(interaction, {
				type: InteractionResponseType.ChannelMessageWithSource,
				data: {
					content: "Thanks for the feature suggestion! We'll review it closely for possible implementation in future updates :)",
					flags: MessageFlags.Ephemeral
				}
			});
		}
	}
}

function command_logger(content: string)
{
	res.post(Routes.channelMessages(DiscordCommandChannel), {
		body: {
			content
		}
	});
}

main();