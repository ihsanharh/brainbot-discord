import { fetch, Response } from 'undici';

import { APIChatInputApplicationCommandInteraction, APIChannel, APIGuildMember, APITextChannel, InteractionResponseType, PermissionFlagsBits } from 'discord-api-types/v10';
import { getOptionsReturnValues } from "../../typings";

import { Rsa, ServerUrl } from "../../utils/config";
import { getGuildChannels, getGuildMember } from "../../utils/functions";
import { compute_permission } from '../../utils/permissions';
import Command from "./base";

import { SetupCommand } from "../../constants/commands.json";
import * as values from "../../constants/values.json";

class Setup extends Command
{
	constructor(interaction: APIChatInputApplicationCommandInteraction)
	{
		super(interaction, SetupCommand);
	}
	
	async execute(): Promise<void>
	{
		this.reply({
			type: InteractionResponseType.DeferredChannelMessageWithSource,
			data: {}
		});

		const selected_channel = this.get_options(SetupCommand.options[0].name) as getOptionsReturnValues;
		const guild_id = this.command?.guild_id ?? "";
		const current_guild_channels = await getGuildChannels(guild_id) as APIChannel[];
		const self_permissions = await compute_permission(await getGuildMember(guild_id, this.me.id) as APIGuildMember, current_guild_channels.filter((channel: APIChannel) => channel.id === selected_channel.channel.id)[0] as APITextChannel);

		if (!((self_permissions & PermissionFlagsBits.ViewChannel) == BigInt(PermissionFlagsBits.ViewChannel)) && !((self_permissions & BigInt(PermissionFlagsBits.SendMessages)) == BigInt(PermissionFlagsBits.SendMessages)))
		{
			this.edit_reply(this.command, {
				body: {
					content: this.pretty(values.commands.setup.cant_see_and_message, selected_channel.channel.id)
				}
			});

			return;
		}
		else if (!((self_permissions & BigInt(PermissionFlagsBits.ViewChannel)) == BigInt(PermissionFlagsBits.ViewChannel)))
		{
			this.edit_reply(this.command, {
				body: {
					content: this.pretty(values.commands.setup.cant_see, selected_channel.channel.id)
				}
			});

			return;
		}
		else if (!((self_permissions & BigInt(PermissionFlagsBits.SendMessages)) == BigInt(PermissionFlagsBits.SendMessages)))
		{
			this.edit_reply(this.command, {
				body: {
					content: this.pretty(values.commands.setup.cant_message, selected_channel.channel.id)
				}
			});

			return;
		}
		
		fetch(`${ServerUrl}/v1/database/chat/${guild_id}`, {
			method: "GET",
			headers: {
				"Accept": "application/json",
				"Authorization": Rsa
			}
		}).then((get_guild_data: Response) => {
			if (get_guild_data.ok)
			{
				fetch(`${ServerUrl}/v1/database/chat/${guild_id}`, {
					method: "PATCH",
					headers: {
						"Authorization": Rsa,
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						$set: {
							channel: selected_channel.channel.id
						}
					})
				});
			}
			else
			{
				fetch(`${ServerUrl}/v1/database/chat/${guild_id}`, {
					method: "POST",
					headers: {
						"Authorization": Rsa,
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						"_id": guild_id,
						"channel": selected_channel.channel.id
					})
				});
			}
	    });

		this.edit_reply(this.command, {
			body: {
				content: this.pretty(values.commands.setup.success, selected_channel.channel.id)
			}
		});
	}
}

export default Setup;