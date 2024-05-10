import { parentPort, TransferListItem } from 'node:worker_threads';

import { APIApplicationCommand, APIApplicationCommandInteractionDataBasicOption, APIApplicationCommandInteractionDataOption, APIChatInputApplicationCommandInteraction, APIInteraction, APIInteractionDataResolved, APIInteractionResponse, APIUser, ApplicationCommandOptionType, Routes } from 'discord-api-types/v10';
import { InteractionResponse, command_metadata, getOptionsReturnValues } from '../../typings';

import { getDiscordUser } from "../../utils/functions";
import { res } from "../../utils/res";
import { edit_original_response } from "../interaction";
import { RawFile, RequestData } from '@discordjs/rest';

class Command
{
	public name: string;
	public author: APIUser;
	public command: APIChatInputApplicationCommandInteraction;
	public me: APIUser;
	public _applicationCommand: command_metadata;
	public _commands: APIApplicationCommand[];
	
	constructor(interaction: APIChatInputApplicationCommandInteraction, metadata: command_metadata)
	{
		this.name = metadata.name;
		this.author = interaction?.member?.user ?? interaction?.user as APIUser;
		this.command = interaction;
		this.me = {} as APIUser;
		this._commands = [];
		this._applicationCommand = metadata;
	}
	
	pretty(str: string, ...args: string[]): string
	{
		return parse_command(str, this._commands, ...args);
	}

	get_options(option_name: string): getOptionsReturnValues | string | number | boolean | null
	{
		let _hoistedOptions = this.command.data?.options;
		if (!_hoistedOptions) return null;

		const option = _hoistedOptions.filter((opt: APIApplicationCommandInteractionDataOption) => opt?.name === option_name)[0] as APIApplicationCommandInteractionDataBasicOption;
		let mentionableOnly = JSON.parse(JSON.stringify(ApplicationCommandOptionType)) as {[k: string]: number;};
		let property = [
			["User", "Member", "Attachment", "Channel", "Role", "Message"],
			["String", "Boolean", "Integer", "Number"]
		];

		if (!option) return null;
		
		property[1].forEach((e: string) => delete mentionableOnly[e]);
		
		if ([...Object.values(mentionableOnly).filter((k: number) => !isNaN(k))].includes(option.type))
		{
			var values: getOptionsReturnValues = {} as getOptionsReturnValues;
			
			property[0].forEach((prop: string) => {
				if (this.command.data && this.command.data.resolved)
				{	
					if (`${String(prop).toLowerCase()}s` in this.command?.data?.resolved) Object.defineProperty(values, String(prop).toLowerCase(), {
						enumerable: true,
						value: { ...this.command?.data?.resolved[`${String(prop).toLowerCase()}s` as keyof APIInteractionDataResolved]?.[option.value as string] }
					});
				}
			});
			
			return values;
		}
		else
		{
			return option.value;
		}
	}
	
	execute(): void
	{}
	
	async props(commands: APIApplicationCommand[]): Promise<void>
	{
		this.me = await getDiscordUser() as APIUser;
		this._commands = commands;

		return this.execute();
	}
	
	async edit_reply(interaction: APIChatInputApplicationCommandInteraction, payload: RequestData): Promise<unknown>
	{
		return await edit_original_response(interaction, payload);
	}

	reply(payload: APIInteractionResponse): void
	{
		respond(this.command, payload)
	}

	get_json(): command_metadata
	{
		return this._applicationCommand;
	}
}

export function parse_command(str: string, _commands: APIApplicationCommand[], ...args: string[]): string
{
	if (!str) return "";

	for (let i = 0; i < args.length; i++)
	{
		str = str.replace(`{${i}}`, args[i]);
	}

	for (const application_command of _commands)
	{
		let key = `</${application_command.name}>`;

		if (str.includes(key)) str = str.replace(key, application_command.id);
	}

	return str;
}

export async function respond(interaction: APIInteraction, payload: APIInteractionResponse, files?: RawFile[]): Promise<void>
{
	res.post(Routes.interactionCallback(interaction.id, interaction.token), {
		body: payload,
		files
	});
}

export default Command;