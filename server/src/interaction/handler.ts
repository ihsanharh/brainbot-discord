import { fetch } from 'undici';
import { workerData } from 'node:worker_threads';

import { APIInteraction, CollectorData, InteractionResponseType, InteractionType, MessageFlags } from "../typings";
import { respond } from "./commands/base";
import { _collect } from "../managers/Collector";
import { Rsa, ServerUrl } from "../utils/config";

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
		try
		{
			var this_command = new (await import(`./commands/${interaction?.data?.name}`)).default();
			
			return await this_command.props(interaction);
		}
		catch(error: unknown)
		{
			console.error(error)
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
		const getState = interaction?.data['custom_id'];
		const state: string = getState.substring(getState.lastIndexOf(".")).substring(1);
		const isCollector: CollectorData | undefined = ActiveCollector.get(state);
		
		if (isCollector && isCollector?.ids.includes(interaction?.data['custom_id']))
		{
			_collect(isCollector as CollectorData, interaction);
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

main();