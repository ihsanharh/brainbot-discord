import { fetch } from 'undici';

import {
	APIChannel,
	APIGuildMember,
	APITextChannel,
	ApplicationCommandOptionType,
	ChannelType,
	getOptionsReturnValues,
	InteractionResponseType,
	PermissionFlagsBits
} from "../../typings";
import { Rsa, ServerUrl } from "../../utils/config";
import { getGuildChannels, getGuildMember, getGuildMemberPermissionsForChannel } from "../../utils/functions";
import { res } from "../../utils/res";
import Command from "./base";

const SetupCommand = {
	name: "setup",
	name_localizations: {},
	description: "Setup the chat bot.",
	description_localizations: {},
	options: [
		{
			type: ApplicationCommandOptionType.Channel,
			name: "channel",
			name_localizations: {},
			description: "Channel where you want to setup the chat bot",
			description_localizations: {},
			required: true,
			channel_types: [ChannelType.GuildText]
		}
	],
	default_member_permissions: String(PermissionFlagsBits.UseApplicationCommands | PermissionFlagsBits.ManageGuild),
	dm_permission: false
}

const SetupCommandUsages: string[] = [
	"</setup:<setup>> channel:#general"
];

class Setup extends Command
{
	constructor()
	{
		super(SetupCommand);
	}
	
	async execute(): Promise<void>
	{
		const selected_channel = this.get_options("channel") as getOptionsReturnValues;
		const current_guild_channels = await getGuildChannels(this.command.guild_id) as APIChannel[];
		
		if (!selected_channel) return this.invalid_usage({ text: "Please provide a channel." }, SetupCommandUsages);
		if (selected_channel.channel.type !== ChannelType.GuildText) return this.invalid_usage({ text: "Invalid channel was provided!", reason: "I only accept text based channel." }, SetupCommandUsages);
		
		const checkSelfPermissions = await getGuildMemberPermissionsForChannel(await getGuildMember(this.command.guild_id, this.me.id) as APIGuildMember, current_guild_channels.filter((channel: APIChannel) => channel.id === selected_channel.channel.id)[0] as APITextChannel);
		
		if (checkSelfPermissions)
		{
			if (((checkSelfPermissions.deny & BigInt(PermissionFlagsBits.ViewChannel)) == BigInt(PermissionFlagsBits.ViewChannel)) && ((checkSelfPermissions.deny & BigInt(PermissionFlagsBits.SendMessages)) == BigInt(PermissionFlagsBits.SendMessages))) return this.invalid_usage({ text: `Hm, I can't see <#${selected_channel.channel.id}> and send messages there.`, reason: "Make sure i have ` View Channel ` and ` Send Messages ` permission for that channel."}, SetupCommandUsages, true);
			else if (((checkSelfPermissions.deny & BigInt(PermissionFlagsBits.ViewChannel)) == BigInt(PermissionFlagsBits.ViewChannel))) return this.invalid_usage({ text: `Uh oh I can't use <#${selected_channel.channel.id}> because i can't see that channel.`, reason: "Make sure i have ` View Channel ` permission for that channel."}, SetupCommandUsages, true);
			else if (((checkSelfPermissions.deny & BigInt(PermissionFlagsBits.SendMessages)) == BigInt(PermissionFlagsBits.SendMessages))) return this.invalid_usage({ text: `It looks like i can't send message in <#${selected_channel.channel.id}>.`, reason: "I'm missing ` Send Message ` permission for that channel."}, SetupCommandUsages, true);
		}
		
		const get_guild_data = await fetch(`${ServerUrl}/database/guild/${this.command.guild_id}`, {
			method: "GET",
			headers: {
				"Accept": "application/json",
				"Authorization": Rsa
			}
		});
		
		if (get_guild_data.ok)
		{
			fetch(`${ServerUrl}/database/guild/${this.command.guild_id}`, {
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
			fetch(`${ServerUrl}/database/guild/${this.command.guild_id}`, {
				method: "POST",
				headers: {
					"Authorization": Rsa,
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					"_id": this.command.guild_id,
					"channel": selected_channel.channel.id
				})
			});
		}
		
		return this.reply({
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				content: `✅ Setup completed! You can talk to me in <#${selected_channel.channel.id}> now.`
			}
		});
	}
}

export default Setup;