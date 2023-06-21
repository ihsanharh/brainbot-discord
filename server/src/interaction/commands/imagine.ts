import { fetch } from 'undici';

import Command from "./base";
import { ImagineLimits, Rsa, ServerUrl } from "../../utils/config";
import { PermissionFlagsBits, InteractionResponseType, MessageFlags } from "../../typings";
import * as Queue from "../../managers/Cache";
import { limits } from "../../stablediffusion/addition";
import { generate } from "../../stablediffusion/imagine";

const ImagineCommand = {
	name: "imagine",
	name_localizations: {},
	description: "Imagine an image based on your prompt",
	description_localizations: {},
	options: [
		{
			type: 3,
			name: "prompt",
			name_localizations: {},
			description: "The prompt to imagine",
			description_localizations: {},
			required: true
		}
	],
	default_member_permissions: String(PermissionFlagsBits.UseApplicationCommands),
	dm_permission: true,
}

class Imagine extends Command
{
	constructor()
	{
		super(ImagineCommand);
	}
	
	async execute(): Promise<void>
	{
		const prompt: string = this.get_options("prompt") as string;
		const rate_limits: number = await limits(this.author);
		
		if (rate_limits[0] >= 5) return this.reply({
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				content: `Due to extreme demand, The imagine command including upscaler is limited to ${ImagineLimits} uses per day. You'll be able to use it again <t:${Math.floor(rate_limits[1]/1000)}:R>`,
				flags: MessageFlags.Ephemeral
			}
		});
		
		if (await Queue.has(`imagine_${this.author?.id}`)) return this.reply({
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				content: `\`You have one image generation in progress! Please wait for it to complete.\` <@${this.author?.id}>`,
				flags: MessageFlags.Ephemeral
			}
		});
		else await Queue.set(`imagine_${this.author?.id}`);
		
		generate(prompt, this.author, this.command?.token, rate_limits[0]);
		return this.reply({
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				content: `**${prompt}** - <@${this.author?.id}> (Waiting to start)`
			}
		});
	}
}

export default Imagine;