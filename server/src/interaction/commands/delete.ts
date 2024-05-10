import { fetch, Response } from 'undici';

import { APIChatInputApplicationCommandInteraction, InteractionResponseType } from 'discord-api-types/v10';
import { HttpStatusCode } from "../../types/http";
import { OwnResponsePayload } from "../../typings";

import { Chat } from "../../schemas/chat";
import { Rsa, ServerUrl } from "../../utils/config";
import Command from "./base";

import { DeleteCommand } from "../../constants/commands.json";
import * as values from "../../constants/values.json";

class Delete extends Command
{
	constructor(interaction: APIChatInputApplicationCommandInteraction)
	{
		super(interaction, DeleteCommand);
	}
	
	async execute(): Promise<void>
	{
		const get_guild_data = await fetch(`${ServerUrl}/v1/database/chat/${this.command.guild_id}`, {
			method: "GET",
			headers: {
				"Accept": "application/json",
				"Authorization": Rsa
			}
		}) as Response;
		
		if (get_guild_data.ok)
		{
			const json_body = await get_guild_data.json() as OwnResponsePayload;

			if (json_body && json_body.d)
			{
				const json_guild_data = json_body.d as Chat;

				if (json_guild_data.channel !== null)
				{
					fetch(`${ServerUrl}/v1/database/chat/${this.command.guild_id}`, {
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
							content: this.pretty(values.commands.delete.DataDeleted, json_guild_data.channel)
						}
					});
				}
				else
				{
					return this.reply({
						type: InteractionResponseType.ChannelMessageWithSource,
						data: {
							content: this.pretty(values.commands.delete.DataReset)
						}
					});
				}
			}
		}
		else if (get_guild_data.status === HttpStatusCode.NOT_FOUND)
		{
			return this.reply({
				type: InteractionResponseType.ChannelMessageWithSource,
				data: {
					content: this.pretty(values.commands.delete.NeverUSedBefore)
				}
			});
		}
	}
}

export default Delete;