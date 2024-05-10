import { APIChatInputApplicationCommandInteraction, APIMessage, InteractionResponseType, MessageFlags } from 'discord-api-types/v10';
import { PredictionLimit, PredictionRequestJson, command_metadata } from "../../typings";

import { followup_message } from "../../interaction/interaction";
import { limits, load_model } from "../../stablediffusion/addition";
import { generate } from "../../stablediffusion/imagine";
import * as Queue from "../../managers/Cache";
import Command from "./base";

import { ImagineCommand } from "../../constants/commands.json";
import * as available_models from "../../constants/models.json";
import * as values from "../../constants/values.json";

class Imagine extends Command
{
	constructor(interaction: APIChatInputApplicationCommandInteraction)
	{
		super(interaction, ImagineCommand);
	}
	
	async execute(): Promise<void>
	{
		const model: string = this.get_options(ImagineCommand.options[0].name) as string;
		const prompt: string = this.get_options(ImagineCommand.options[1].name) as string;
		const negative_prompt: string = this.get_options(ImagineCommand.options[2].name) as string;
		const rate_limits: PredictionLimit = await limits(this.author);
		
		if (typeof rate_limits.daily_quota === "number" && rate_limits.today >= rate_limits.daily_quota) return this.reply({
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				content: this.pretty(values.commands.imagine.limit_reached, String(rate_limits.daily_quota), `<t:${Math.round(rate_limits.last_timestamp/1000)}>`),
				flags: MessageFlags.Ephemeral
			}
		});
		
		if (await Queue.has(`imagine_${this.author?.id}`)) return this.reply({
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				content: values.commands.imagine.calmdown,
				flags: MessageFlags.Ephemeral
			}
		});
		
		Queue.set(`imagine_${this.author?.id}`, `${new Date().getTime()}`, values.TimeOut.ImagineTaskTimeout);

		const use_model = load_model({ model, prompt, negative_prompt });
		let no_prompt;

		if (!use_model.exist) return this.reply({
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				content: values.commands.imagine.model_not_found,
				flags: MessageFlags.Ephemeral
			}
		});

		this.reply({
			type: InteractionResponseType.ChannelMessageWithSource,
			data: {
				content: this.pretty(values.commands.imagine.predict_status, use_model.default?.prompt as string, this.author.id, "Waiting to start")
			}
		});

		if (!prompt) no_prompt = await followup_message(this.command, {
			body: {
				content: values.commands.imagine.no_prompt,
				flags: MessageFlags.Ephemeral
			}
		}) as APIMessage;

		generate(use_model, this.author, this.command?.token, rate_limits, no_prompt);
	}

	get_json(): command_metadata
	{
		const models = Object.entries<PredictionRequestJson>(JSON.parse(JSON.stringify(available_models))).filter(([name, _]) => name !== "_default").map(([_, model]) => { return { name: model.name, value: _ } });
		const JImagineCommand = JSON.parse(JSON.stringify(ImagineCommand));

		JImagineCommand.options[0].choices = models;

		return JImagineCommand;
	}
}

export default Imagine;