require('sharp');

import { fetch } from 'undici';
import { workerData } from 'node:worker_threads';

import { APIAttachment, APIInteraction, CollectorData, InteractionResponseType, InteractionType, MessageFlags, Routes } from "../typings";
import { respond } from "./commands/base";
import { _collect } from "../managers/Collector";
import { upscaler } from "../stablediffusion/realesrgan";
import { DiscordCommandChannel, Rsa, ServerUrl } from "../utils/config";
import { res } from "../utils/res";

async function main(): Promise<void>
{
	var { collectors, interaction } = workerData;
	interaction = JSON.parse(interaction) as APIInteraction;
	const ActiveCollector: Map<string, CollectorData> = new Map<string, CollectorData>(JSON.parse(collectors));
	
	if (interaction?.type === InteractionType.Ping)
	{
		console.log(`Discord ping received.`);

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
			var this_command = new (await import(`./commands/${interaction?.data?.name}`)).default();
			
			command_logger(`${when} **${author.username}#${author.discriminator}** used </${interaction?.data['name']}:${interaction?.data['id']}>`);
			return await this_command.props(interaction);
		}
		catch(error: unknown)
		{
			console.error(error)
			command_logger(`${when} **${author.username}#${author.discriminator}** encountered an error while using </${interaction?.data['name']}:${interaction?.data['id']}>`);
			return respond(interaction, {
				type: InteractionResponseType.ChannelMessageWithSource,
				data: {
					content: "Unknown command.",
					flags: MessageFlags.Ephemeral
				}
			});
		}
	}
	else if (interaction?.type === InteractionType.MessageComponent)
	{
		const customId = interaction?.data['custom_id'];
		const collectorState: string = customId.substring(customId.lastIndexOf(".")).substring(1);
		const isCollector: CollectorData | undefined = ActiveCollector.get(collectorState);
		
		if (isCollector && isCollector?.ids.includes(interaction?.data['custom_id']))
		{
			_collect(isCollector, interaction);
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
		else if (customId.startsWith("imagine_upscale"))
		{
			var updatedButtons = [];
			var existingComponents = interaction.message.components[0].components;
			var selectedImageIndex = String(customId).substr(String(customId).lastIndexOf(";")).replace(";", "");
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
				data: {
					components: []
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