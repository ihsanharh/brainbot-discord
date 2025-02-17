import { nanoid } from 'nanoid';
import { fetch } from 'undici';

import { APIApplicationCommand, APIButtonComponentWithCustomId, APIChatInputApplicationCommandInteraction, APIEmbed, APIEmbedField, APIInteractionGuildMember, APIInteractionResponseCallbackData, APIMessageActionRowComponent, APIMessageComponentInteraction, APIMessageStringSelectInteractionData, APISelectMenuOption, APIUser, ComponentType, InteractionResponseType, MessageFlags, Routes } from 'discord-api-types/v10';
import { CollectorData, command_metadata } from "../../typings";

import Command, { respond } from "./base";
import { colourInt, getDiscordUser, makeAvatarUrl } from "../../utils/functions";
import { Rsa, ServerUrl } from "../../utils/config";
import { res } from "../../utils/res";

import { HelpCommand as JHelpCommand } from "../../constants/commands.json";
import * as Colours from "../../constants/colours.json";
import * as values from "../../constants/values.json";
import * as JHelpMod from "../../constants/discord/help-mod.json";
import * as JBackButton from "../../constants/discord/button/back.json";
import * as JHelpMenu from "../../constants/discord/embed/help-menu.json";
import * as JSuggestAFeature from "../../constants/discord/modal/suggest-a-feature.json";
import * as JSelectMenu from "../../constants/discord/select-menu/help-select.json";

export const customId = {
	CommandsListEmbed: `CommandList.Embed`,
	HelpMenuButton: `HelpMenuHome.Button`,
	HelpMenuEmbed: `HelpMenu.Embed`,
	HelpMenuSelect: `HelpMenu.Select`,
	unknown: `unknown`,
	long: (id: string, cid: string) => `${id}.${cid}`,
	short: (id: string) => id.substring(0, id.lastIndexOf("."))
}

function BackButton(id: string): APIButtonComponentWithCustomId
{
	let back_button = JSON.parse(JSON.stringify(JBackButton));
	back_button.custom_id = id;

	return back_button;
}

function SelectMenu(id: string): APIMessageActionRowComponent
{
	let select_menu = JSON.parse(JSON.stringify(JSelectMenu));
	select_menu.custom_id = id;
	select_menu.options = JHelpMod.modules;

	return select_menu;
}

async function Embed(id: string, user?: {me?: APIUser, member?: APIInteractionGuildMember}, _commands?: APIApplicationCommand[]): Promise<APIEmbed>
{
	if (id === customId.HelpMenuEmbed)
	{
		if (!user?.me) throw new Error(`'user.me' parameter is required for '${id}'!`);
		let HelpMenu = JSON.parse(JSON.stringify(JHelpMenu));

		HelpMenu.color = colourInt(Colours[JHelpMenu.color as keyof typeof Colours]);
		HelpMenu.thumbnail.url = makeAvatarUrl(user.me);

		return HelpMenu;
	}
	else if (id === customId.CommandsListEmbed)
	{
		if (!user?.member) throw new Error(`'user.member' parameter is required for '${id}'!`);
		
		let CommandsFields: APIEmbedField[] = [];
		let title;

		if (!_commands) CommandsFields.push(values.commands.help.Embed.CommandsList.NoCommands as APIEmbedField);
		else
		{
			title = values.commands.help.Embed.CommandsList.title;
			_commands.filter((ApplicationCommand: APIApplicationCommand) => {
				const author_permissions = BigInt(user?.member?.permissions as string);
				const command_permissions = BigInt(ApplicationCommand.default_member_permissions as string);
				
				return (author_permissions & command_permissions) === command_permissions;
			}).map((ApplicationCommand: APIApplicationCommand) => {
				return CommandsFields.push({
					inline: true,
					name: `</${ApplicationCommand.name}:${ApplicationCommand.id}>`,
					value: `${ApplicationCommand.description}`
				} as APIEmbedField);
			});
		}
		
		return {
			title,
			fields: [...CommandsFields],
			color: colourInt(Colours["blurple.MainColour"]),
			thumbnail: {
				url: makeAvatarUrl(user?.me as APIUser)
			}
		};
	}
	else return {};
}

export async function handleHelpSelect(id: string, interaction: APIMessageComponentInteraction, _commands: APIApplicationCommand[]): Promise<void>
{
	var bot: APIUser = await getDiscordUser() as APIUser;
	var selectmenu_data = interaction.data as APIMessageStringSelectInteractionData;

	// select menu handling
	if (selectmenu_data['values']?.[0] === JHelpMod.modules[0].value)
	{
		// return when a command list selected
		respond(interaction, {
			type: InteractionResponseType.UpdateMessage,
			data: {
				embeds: [await Embed(customId.CommandsListEmbed, { me: bot, member: interaction.member }, _commands)],
				components: [{
					type: ComponentType.ActionRow,
					components: [BackButton(customId.long(customId.HelpMenuButton, id))]
				}]
			}
		});
	}
	else if (selectmenu_data['values']?.[0] === JHelpMod.modules[1].value)
	{
		// return when suggest a feature selected
		respond(interaction, {
			type: InteractionResponseType.Modal,
			data: JSuggestAFeature
		});
	}
	// button handling
	else if (selectmenu_data['custom_id'].startsWith(customId.short(customId.HelpMenuButton)))
	{
		// when the user pressed back in the command list menu
		respond(interaction, {
			type: InteractionResponseType.UpdateMessage,
			data: {
				embeds: [await Embed(customId.HelpMenuEmbed, { me: bot })],
				components: [{
					type: ComponentType.ActionRow,
					components: [SelectMenu(customId.long(customId.HelpMenuSelect, id))]
				}]
			}
		});
	}
	else
	{
		// unknown???
		const random_unknown_res = Math.floor(Math.random() * values.commands.help.unknown.length);

		respond(interaction, {
			type: InteractionResponseType.UpdateMessage,
			data: {}
		});

		await res.post(`${Routes.webhook(bot.id, interaction.token)}?wait=true`, {
			body: {
				content: values.commands.help.unknown[random_unknown_res],
				flags: MessageFlags.Ephemeral
			}
		});
	}
}

export async function _collectorCollect(data: CollectorData, interaction: APIMessageComponentInteraction, _commands: APIApplicationCommand[]): Promise<void>
{
	handleHelpSelect(data.id, interaction, _commands);
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

						Object.defineProperty(message.components[ARIndex].components[ItsIndex], "disabled", {
							value: true,
							enumerable: true
						});
					}
				}
			}
	    }

	 	try
		{
			await res.patch(Routes.channelMessage(data?.message?.['channel_id'] as string, data?.message?.id as string), {
				body: {
					components: message.components
			    }
	   		});
		}
		catch
		{}
	}
}

class Help extends Command
{
	constructor(interaction: APIChatInputApplicationCommandInteraction)
	{
		super(interaction, JHelpCommand);
	}
	
	async execute(): Promise<void>
	{
		const collector_id = nanoid();
		const selected_category = this.get_options(JHelpCommand.options[0].name);
		let activateCollector = true;
		var payload: APIInteractionResponseCallbackData = {
			embeds: [await Embed(customId.HelpMenuEmbed, { me: this.me })],
			components: [
				{
					type: ComponentType.ActionRow,
					components: [SelectMenu(customId.long(customId.HelpMenuSelect, collector_id))]
				}
			]
		};
		
		if (selected_category)
		{
			activateCollector = false;

			if (selected_category === JHelpMod.modules[0].value) payload = {
		        embeds: [await Embed(customId.CommandsListEmbed, { me: this.me, member: this.command?.member }, this._commands)]
			}
			else if (selected_category === JHelpMod.modules[1].value)
			{
				return this.reply({
					type: InteractionResponseType.Modal,
					data: JSuggestAFeature
				});
			}
		}
		
		if (activateCollector)
		{
			fetch(`${ServerUrl}/_collector/new`, {
				method: "POST",
				headers: {
					"Authorization": Rsa,
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					id: collector_id,
					filename: "help.js",
					pwd: __dirname,
					time: 60000,
					expand_on_click: true,
					component_ids: [
						customId.long(customId.HelpMenuButton, collector_id),
						customId.long(customId.HelpMenuSelect, collector_id)
					],
					component_types: [
						ComponentType.Button,
						ComponentType.StringSelect
					]
				})
			});
		}

		return this.reply({
			type: InteractionResponseType.ChannelMessageWithSource,
			data: payload
		});
	}

	get_json(): command_metadata
	{
		let HelpCommand = JSON.parse(JSON.stringify(JHelpCommand));
		HelpCommand.options[0].choices = JSON.parse(JSON.stringify(JHelpMod)).modules.map((mod: APISelectMenuOption) => { return { name: mod.label, value: mod.value } });

		return HelpCommand;
	}
}

export default Help;