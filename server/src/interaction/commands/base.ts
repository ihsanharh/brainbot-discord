import { parentPort } from 'node:worker_threads';

import {
	APIApplicationCommandOption,
	APIInteraction,
	APIInteractionResponse,
	APIUser,
	ApplicationCommandOptionType,
	getOptionsReturnValues,
	InteractionType,
	InteractionResponseType,
	command_metadata
} from '../../typings';
import { colourInt, getDiscordUser } from "../../utils/functions";
const Colours = require("../../utils/colours.json");

class Command
{
	public name!: string;
	public name_localizations?:
	{
		[key: string]: string;
	};
	public description!: string;
	public description_localizations?:
	{
		[key: string]: string;
	};
	public options?: APIApplicationCommandOption[];
	public default_member_permissions?: string;
	public dm_permission?: boolean;
	public type?: number | string;
	public author!: APIUser;
	public command!: {[k:string]:any};
	public me!: APIUser;
	public _applicationCommand!: command_metadata;
	
	constructor(metadata: command_metadata)
	{
		Object.assign(this, metadata);
		Object.defineProperty(this, "_applicationCommand", {
			enumerable: true,
			writable: false,
			value: metadata
		});
	}
	
	get_options(option_name: string): getOptionsReturnValues | string | number | boolean | null
	{
		let _hoistedOptions = this.command.data?.options;
		if (!_hoistedOptions) return null;
		
		const option = _hoistedOptions.filter((opt: any) => opt?.name === option_name)[0];
		var mentionableOnly = JSON.parse(JSON.stringify(ApplicationCommandOptionType));
		var property = [
			["User", "Member", "Attachment", "Channel", "Role", "Message"],
			["String", "Boolean", "Integer", "Number"]
		];
		
		property[1].forEach((e: string) => delete mentionableOnly[e]);
		
		if ([...Object.values(mentionableOnly).filter((k: any) => !isNaN(k))].includes(option.type))
		{
			var values: getOptionsReturnValues = {} as getOptionsReturnValues;
			
			property[0].forEach((prop: string) => {
				if (`${String(prop).toLowerCase()}s` in this.command?.data?.resolved) Object.defineProperty(values, String(prop).toLowerCase(), {
					enumerable: true,
					value: { ...this.command?.data?.resolved[`${String(prop).toLowerCase()}s`][option.value] }
				});
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
	
	invalid_usage(messages: { text: string; reason?: string; }, usages: string[], error: boolean = false) {
		let _text = `**Invalid command usage! ${messages.text}**`;
		
		if (usages.length > 1) {
			var examples = usages.join("\n  ");
			
			_text += `\n\n❓ Example(s) of usage**:\n  ${examples}`;
		}
		
		if (error) _text = `**Error: ${messages.text}**`;
		if (error && messages.reason) _text += `\n${messages.reason}`;
		
		return this.reply({
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				embeds: [
					{
						color: colourInt(Colours['red.InvalidUsage']),
						description: `❌ ${_text}`
					}
				]
			}
		});
	}
	
	async props(interaction: APIInteraction): Promise<void>
	{
		this.command = interaction;
		this.author = interaction?.member?.user ?? interaction?.user as APIUser;
		this.me = await getDiscordUser() as APIUser;
		
		return this.execute();
	}
	
	reply(payload: APIInteractionResponse): void
	{
		respond(this.command, payload);
	}
}

export async function respond(interaction: {[k:string]:any}, payload: APIInteractionResponse): Promise<void>
{
	parentPort?.postMessage(payload);
}

export default Command;