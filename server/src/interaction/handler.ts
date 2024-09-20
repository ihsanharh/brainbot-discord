import { fetch } from 'undici';
import { workerData } from 'node:worker_threads';
import * as path from 'path';

import { APIApplicationCommand, APIInteraction, InteractionResponseType, InteractionType, MessageFlags, Routes } from 'discord-api-types/v10';
import { CollectorData, } from "../typings";

import { parse_command, respond } from "./commands/base";
import { upscaler } from "../txt2img/upscale";
import { DiscordCommandChannel, Rsa, ServerUrl } from "../utils/config";
import { res } from "../utils/res";
import { show_original_image } from "../txt2img/addition";
import logger from "../services/logger";

async function main(): Promise<void>
{
	var { collectors, interaction, commands } = workerData;
	interaction = JSON.parse(interaction) as APIInteraction;
	commands = JSON.parse(commands) as APIApplicationCommand[];
	
	if (interaction?.type === InteractionType.Ping)
	{
		logger.info(`Discord ping received.`);

		return respond(interaction, {
			type: InteractionResponseType.Pong
		});
	}
	else if (interaction?.type === InteractionType.ApplicationCommand)
	{
		let author = interaction?.user ?? interaction?.member?.user;
		let when: string = `<t:${Math.floor(Date.now()/1000)}:R>`;
		
		try
		{
			var this_command = new (await import(`./commands/${interaction?.data?.name}`)).default(interaction);
			
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
					content: parse_command("", commands),
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
		else if (customId.startsWith("show_result;"))
		{
			const image_data = customId.split(";");
			console.log
			show_original_image(interaction, image_data[1], image_data[2]);
		}
		else if (customId.startsWith("imagine_upscale"))
		{
			var updatedButtons = [];
			var existingComponents = interaction.message.components[0].components;
			var selectedImageIndex = String(customId).substring(String(customId).lastIndexOf(";")).replace(";", "");
			var selectedComponent;
			
			for (let i = 0; i < existingComponents.length; i++)
			{
				if (existingComponents[i].custom_id === customId)
				{
					var { style, ...parts } = existingComponents[i];
					selectedComponent = existingComponents[i];
					updatedButtons.push({
						...parts,
						style: 1
					});
				}
				else updatedButtons.push(existingComponents[i]);
			}
						
			upscaler(interaction, selectedComponent, selectedImageIndex.split(".")[0], Number(selectedImageIndex.split(".")[1]));
			return respond(interaction, {
				type: InteractionResponseType.UpdateMessage,
				data: {
					components: [
						{
							type: 1,
							components: updatedButtons,
						}
					]
				}
			})
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