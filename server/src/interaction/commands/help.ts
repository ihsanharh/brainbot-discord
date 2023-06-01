import { fetch } from 'undici';

import {
	APIActionRowComponent,
	APIApplicationCommand,
	APIButtonComponentWithCustomId,
	APIEmbed,
	APIEmbedField,
	APIMessageActionRowComponent,
	APIInteraction,
	APIInteractionGuildMember,
	APIUser,
	ApplicationCommandOptionType,
	CollectorData,
	InteractionResponseType,
	InteractionType,
	PermissionFlagsBits,
	Routes
} from "../../typings";
import Command, { respond } from "./base";
import { colourInt, getDiscordUser, makeAvatarUrl, makeId } from "../../utils/functions";
import { Rsa, ServerUrl } from "../../utils/config";
import { res } from "../../utils/res";
import { getAllApplicationCommands } from "../../managers/ApplicationCommand";
const Colours = require("../../utils/colours.json");

const HelpCommand = {
	name: "help",
	name_localizations: {}, 
	description: "Send the help menu.",
	description_localizations: {},
	options: [
		{
			type: ApplicationCommandOptionType.String,
			name: "choice",
			name_localizations: {},
			description: "Category you need help with.",
			description_localizations: {},
			required: false,
			choices: [
				{
					name: "Commands list",
					name_localizations: {},
					value: "commands"
				}
			]
		}
	],
	default_member_permissions: String(PermissionFlagsBits.UseApplicationCommands),
	dm_permission: false
}

const state = makeId(30);

export const customId: {
	CommandsListEmbed: string;
	HelpMenuButton: string;
	HelpMenuEmbed: string;
	HelpMenuSelect: string;
	unknown: string;
	short: (id: string) => string;
} = {
	CommandsListEmbed: `CommandList.Embed`,
	HelpMenuButton: `HelpMenuHome.Button.${state}`,
	HelpMenuEmbed: `HelpMenu.Embed`,
	HelpMenuSelect: `HelpMenu.Select.${state}`,
	unknown: `unknown`,
	short: (id: string) => id.substr(0, id.lastIndexOf("."))
}

function Button(T: string): APIButtonComponentWithCustomId
{
	if (T.startsWith(customId.short(customId.HelpMenuButton))) return {
		type: 2,
		style: 2,
		label: "⬅️ Back",
		custom_id: T
	} as APIButtonComponentWithCustomId
	else return {
		type: 2,
		style: 2,
		custom_id: customId.unknown
	} as APIButtonComponentWithCustomId;
}

function SelectMenu(T: string, disabled?: boolean): APIMessageActionRowComponent
{
	if (T.startsWith(customId.short(customId.HelpMenuSelect))) return {
		type: 3,
		custom_id: T,
		disabled: disabled ?? false,
		options: [
			{
				label: "Commands List",
				value: HelpCommand?.options[0].choices[0].value
			}
		],
		min_values: 1,
		max_values: 1
	} as APIMessageActionRowComponent
	else return {
		type: 3,
		custom_id: customId.unknown
	} as APIMessageActionRowComponent;
}

async function Embed(T: string, user?: {me?: APIUser, member?: APIInteractionGuildMember}): Promise<APIEmbed>
{
	if (T === customId.HelpMenuEmbed)
	{
		if (!user?.me) throw new Error(`'user.me' parameter is required for '${T}'!`);
		
		return {
			title: `Welcome to Brain Bot's Help menu!`,
			description: "it learns and imitates, is social content. can seem rude or inappropriate - talk with caution and at your own risk.\n\nthe bot pretends to be human - don't give personal info even if it 'asks'.\n\nBrain Bot does not understand you, and cannot mean anything it 'says'.",
			color: colourInt(Colours["blurple.MainColour"]),
			thumbnail: {
				url: makeAvatarUrl(user?.me)
			}
		} as APIEmbed;
	}
	else if (T === customId.CommandsListEmbed)
	{
		if (!user?.member) throw new Error(`'user.member' parameter is required for '${T}'!`);
		
		var CommandsFields: APIEmbedField[] = [];
		var RegisteredCommands: APIApplicationCommand[] = await getAllApplicationCommands() as APIApplicationCommand[];
		if (RegisteredCommands.length < 1) CommandsFields.push({
			name: "No commands available atm."
		} as APIEmbedField);
		else
		{
			RegisteredCommands.filter((ApplicationCommand: APIApplicationCommand) => {
				const author_permissions = BigInt(user?.member?.permissions as string);
				const command_permissions = BigInt(ApplicationCommand.default_member_permissions as string);
				
				return (author_permissions & command_permissions) === command_permissions;
			}).map((ApplicationCommand: APIApplicationCommand) => {
				return CommandsFields.push({
					inline: true,
					name: `</${ApplicationCommand.name}:${ApplicationCommand.id}>`,
					value: `${ApplicationCommand.description}`
				} as APIEmbedField);
			})
		}
		
		return {
			title: "Commands List",
			fields: [...CommandsFields],
			color: colourInt(Colours["blurple.MainColour"]),
			thumbnail: {
				url: makeAvatarUrl(user?.me as APIUser)
			}
		} as APIEmbed;
	}
	else return {};
}

export async function handleHelpSelect(id: string, interaction: {[k: string]: any}): Promise<void>
{
	var Embeds: APIEmbed = await Embed(customId.unknown), Component = SelectMenu(customId.unknown);
	var bot: APIUser = await getDiscordUser() as APIUser;
	
	if (interaction?.data['values']?.[0] === HelpCommand?.options[0].choices[0].value)
	{
		Embeds = await Embed(customId.CommandsListEmbed, { me: bot ,member: interaction.member });
		Component = Button(customId.short(customId.HelpMenuButton)+"."+id);
	}
	else if (interaction?.data['custom_id'].startsWith(customId.short(customId.HelpMenuButton)))
	{
		Embeds = await Embed(customId.HelpMenuEmbed, { me: bot });
		Component = SelectMenu(customId.short(customId.HelpMenuSelect)+"."+id);
	}
	
	respond(interaction, {
		type: InteractionResponseType.UpdateMessage,
		data: {
			embeds: [Embeds],
			components: [
				{
					type: 1,
					components: [Component]
				}
			]
		}
	});
}

export async function _collectorCollect(data: CollectorData, interaction: APIInteraction): Promise<void>
{
	handleHelpSelect(data.id, interaction);
}

export async function _collectorEnd(data: CollectorData): Promise<void>
{
	if (data.message) await res.patch(Routes.channelMessage(data?.message?.['channel_id'] as string, data?.message?.id as string), {
		body: {
			components: []
		}
	});
}

class Help extends Command
{
	constructor()
	{
		super(HelpCommand);
	}
	
	async execute(): Promise<void>
	{
		const selected_category = this.get_options(HelpCommand?.options[0].name);
		var payload: {embeds:APIEmbed[], components?:APIActionRowComponent<APIMessageActionRowComponent>[]} = {
			embeds: [await Embed(customId.HelpMenuEmbed, { me: this.me })],
			components: [
				{
					type: 1,
					components: [SelectMenu(customId.HelpMenuSelect)]
				}
			]
		}
		
		if (selected_category && selected_category === HelpCommand?.options[0].choices[0].value) payload = {
			embeds: [await Embed(customId.CommandsListEmbed, { me: this.me ,member: this.command?.member })]
		}
		
		fetch(`${ServerUrl}/_collector/new`, {
			method: "POST",
			headers: {
				"Authorization": Rsa,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				id: state,
				command: true,
				name: "help",
				pwd: __dirname,
				time: 60000,
				ids: [...Object.values(customId)]
			})
		});
		
		return this.reply({
			type: InteractionResponseType.ChannelMessageWithSource,
			data: payload
		});
	}
}

export default Help;