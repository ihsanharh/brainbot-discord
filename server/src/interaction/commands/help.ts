import { fetch } from 'undici';

import { APIActionRowComponent, APIApplicationCommand, APIButtonComponentWithCustomId, APIEmbed, APIEmbedField, APIMessageActionRowComponent, APITextInputComponent, APIInteraction, APIInteractionGuildMember, APIUser, ApplicationCommandOptionType, CollectorData, ComponentType, InteractionResponseType, PermissionFlagsBits, Routes, TextInputStyle } from "../../typings";
import Command, { respond } from "./base";
import { colourInt, getDiscordUser, makeAvatarUrl, makeId } from "../../utils/functions";
import { Rsa, ServerUrl } from "../../utils/config";
import { res } from "../../utils/res";
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
				},
				{
					name: "Suggest a Feature",
					name_localizations: {},
					value: "suggest"
				}
			]
		}
	],
	default_member_permissions: String(PermissionFlagsBits.UseApplicationCommands),
	dm_permission: false
}

const state = makeId(30);

export const customId: {
	[k: string]: any;
} = {
	CommandsListEmbed: `CommandList.Embed`,
	HelpMenuButton: `HelpMenuHome.Button.${state}`,
	HelpMenuEmbed: `HelpMenu.Embed`,
	HelpMenuSelect: `HelpMenu.Select.${state}`,
	SuggestAFeatureModal: `SuggestAFeature.Modal`,
	unknown: `unknown`,
	short: (id: string) => id.substring(0, id.lastIndexOf("."))
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
				label: "View All Commands",
				value: HelpCommand?.options[0].choices[0].value,
				description: "Unlock my full potential with this comprehensive list."
			},
			{
				label: "Suggest a Feature",
				value: HelpCommand?.options[0].choices[1].value,
				description: "Have a brilliant idea? I'm always looking to improve!"
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
			title: `Hey there! I'm ${user.me.username}, your resident Discord hype-bot! <:brainbot:992352663779946536>`,
			description: "I'm your friendly Discord bot, designed to enhance your chats with fun features, useful tools, and plenty of personality.\n\nNeed some fun in your chats? Maybe a little friendly competition?  Or just someone to automate those pesky tasks? I'm your bot!",
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
		var FetchCommands = await fetch(ServerUrl + "/_commands");
		var RegisteredCommands: APIApplicationCommand[] = FetchCommands.ok? await FetchCommands.json() as APIApplicationCommand[]: [];
		
		if (!FetchCommands.ok || RegisteredCommands && RegisteredCommands.length < 1) CommandsFields.push({
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

async function Modal(T: string): Promise<{custom_id: string; title: string; components: APIActionRowComponent<APITextInputComponent>[]}>
{
	if (T === customId.SuggestAFeatureModal)
	{
		return {
			custom_id: T,
			title: "Suggest A Feature",
			components: [
				{
					type: ComponentType.ActionRow,
					components: [
						{
							type: ComponentType.TextInput,
							custom_id: "Feature",
							label: "Feature Idea",
							style: TextInputStyle.Short,
							required: true,
							placeholder: "Briefly describe your awesome suggestion..."
						},
					]
				},
				{
					type: ComponentType.ActionRow,
					components: [
						{
							type: ComponentType.TextInput,
							custom_id: "FeatureDetails",
							label: "Details (Optional)",
							style: TextInputStyle.Paragraph,
							required: false,
							placeholder: "Explain why this would be useful, how it might work, etc."
						}
					]
				}
		    ]
		}
	}
	else return {
		custom_id: customId.unknown,
		title: "unknown",
		components: []
	}
}

export async function handleHelpSelect(id: string, interaction: {[k: string]: any}): Promise<void>
{
	var bot: APIUser = await getDiscordUser() as APIUser;

	// select menu handling
	if (interaction?.data['values']?.[0] === HelpCommand?.options[0].choices[0].value)
	{
		// return when a command list selected
		respond(interaction, {
			type: InteractionResponseType.UpdateMessage,
			data: {
				embeds: [await Embed(customId.CommandsListEmbed, { me: bot ,member: interaction.member })],
				components: [{
					type: ComponentType.ActionRow,
					components: [Button(customId.short(customId.HelpMenuButton)+"."+id)]
				}]
			}
		});
	}
	else if (interaction?.data['values']?.[0] === HelpCommand?.options[0].choices[1].value)
	{
		// return when suggest a feature selected
		respond(interaction, {
			type: InteractionResponseType.Modal,
			data: await Modal(customId.SuggestAFeatureModal)
		});
	}
	// button handling
	else if (interaction?.data['custom_id'].startsWith(customId.short(customId.HelpMenuButton)))
	{
		// when the user pressed back in the command list menu
		respond(interaction, {
			type: InteractionResponseType.UpdateMessage,
			data: {
				embeds: [await Embed(customId.HelpMenuEmbed, { me: bot })],
				components: [{
					type: ComponentType.ActionRow,
					components: [SelectMenu(customId.short(customId.HelpMenuSelect)+"."+id)]
				}]
			}
		});
	}
	else
	{
		// unknown???
		respond(interaction, {
			type: InteractionResponseType.UpdateMessage,
			data: {
				content: "unknown...."
			}
		});
	}
}

export async function _collectorCollect(data: CollectorData, interaction: APIInteraction): Promise<void>
{
	handleHelpSelect(data.id, interaction);
}

export async function _collectorEnd(data: CollectorData): Promise<void>
{
	if (data.message) {
		const message = data.message;

		if (message.components && message.components.length >= 1)
		{
			for (const ActionRow of message.components)
			{
				if (ActionRow.components && ActionRow.components.length >= 1)
				{
					for (const Component of ActionRow.components)
					{
						const ARIndex = message.components.indexOf(ActionRow);
					    const ItsIndex = ActionRow.components.indexOf(Component);

						Object.defineProperty(message.components[ARIndex].components[ItsIndex], `disabled`, {
							value: true,
							enumerable: true
						});
					}
				}
			}
	    }

	 	await res.patch(Routes.channelMessage(data?.message?.['channel_id'] as string, data?.message?.id as string), {
			body: {
				components: message.components
		    }
	    });
	}
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
		let resType = InteractionResponseType.ChannelMessageWithSource;
		let activateCollector = true;
		var payload: any = {
			embeds: [await Embed(customId.HelpMenuEmbed, { me: this.me })],
			components: [
				{
					type: ComponentType.ActionRow,
					components: [SelectMenu(customId.HelpMenuSelect)]
				}
			]
		}
		
		if (selected_category)
		{
			activateCollector = false;

			if (selected_category === HelpCommand?.options[0].choices[0].value) payload = {
		        embeds: [await Embed(customId.CommandsListEmbed, { me: this.me ,member: this.command?.member })]
			}
			else if (selected_category === HelpCommand?.options[0].choices[1].value)
			{
				resType = InteractionResponseType.Modal;
				payload = await Modal(customId.SuggestAFeatureModal);
			}
		}
		
		if (activateCollector) fetch(`${ServerUrl}/_collector/new`, {
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
			type: resType,
			data: payload
		});
	}
}

export default Help;