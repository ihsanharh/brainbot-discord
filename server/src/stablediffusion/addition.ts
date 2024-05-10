import { RawFile } from '@discordjs/rest';
import { Response, fetch } from 'undici';
import * as Sharp from 'sharp';

import { APIAttachment, APIChannel, APIInteraction, APIMessage, APIUser, InteractionResponseType, MessageFlags, Routes } from 'discord-api-types/v10'; ;
import { Imagine } from "../schemas/imagine";
import { HttpStatusCode } from "../types/http";
import { CheckPredictionType, OwnResponsePayload, PredictionRequestJson } from "../typings";

import { respond } from "../interaction/commands/base";
import { edit_original_response, delete_followup_message, followup_message } from "../interaction/interaction";
import { Dev, DiscordChannelStorage, Rsa, SdUrl, ServerUrl } from "../utils/config";
import { res } from "../utils/res";
import logger from "../services/logger";

import * as available_models from "../constants/models.json";
import * as values from "../constants/values.json";

export async function check_prediction(token: string, currPred: CheckPredictionType, message_id?: string): Promise<CheckPredictionType>
{
	await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 1200));
	const get_pred = await fetch(SdUrl, {
		method: "GET",
		headers: {
			"Acccept": "application/json",
			"Prediction-Id": `${currPred.prediction.id}`,
			"Include-B64": "true"
		}
	})

	const mimiic = await get_pred.text()
	let prediction = JSON.parse(mimiic);
	let helpful_m, tensec_m;

	if (typeof prediction.logs === "string" && prediction?.logs.toLowerCase().includes("nsfw")) return {
		prediction,
		nsfw_found: true
	}
	
	if (prediction.status === "processing" && prediction?.logs)
	{
		const predict_percentage_split = prediction?.logs.split("\n");
		const predict_percentage = predict_percentage_split[predict_percentage_split.length - 1];

		edit_original_response(token, {
			body: {
				content: predict_percentage
			}
		}, message_id);
		if (currPred.tensec_m) delete_followup_message(token, currPred.tensec_m?.id);
		if (currPred.helpful_m) delete_followup_message(token, currPred.helpful_m?.id);
	}
	else if (prediction.status === "starting")
	{
		/**
		 * checkk for starting status
		 */
		const created_time = Date.parse(prediction.created_at);
		const now_time = Date.now() - created_time;
		
		if (now_time >= 15000 && !currPred.tensec_m)
		{
			/**
			 * if the status hasnt been updated in 10 secs, send a follow up message.
			 */
			tensec_m = await followup_message(token, {
				body: {
					content: values.commands.imagine.unused_model,
					flags: MessageFlags.Ephemeral
				}
			}) as APIMessage;
		}
		else if (now_time >= 60000 && !currPred.helpful_m)
		{
			/**
			 * here we do checking if the starting status is longer than 60 secs
			 * incase the server is down, just to let the user know.
			 */
			const preset_messages = values.commands.imagine.double_checking;

			helpful_m = await followup_message(token, {
				body: {
					content: preset_messages[Math.floor(Math.random() * preset_messages.length)],
					flags: MessageFlags.Ephemeral
				}
			}) as APIMessage;
		}
	}

	return {
		prediction,
		helpful_m: currPred.helpful_m ?? helpful_m,
		tensec_m: currPred.tensec_m ?? tensec_m
	};
}

export async function limits(author: APIUser): Promise<{ today: number; daily_quota: number|string; last_timestamp: number; }>
{
	const now_time = new Date().getTime();

	if (author.id === Dev) return {
		today: 0,
		daily_quota: "∞",
		last_timestamp: now_time
	};

	const req = await fetch(ServerUrl+"/v1/database/imagine/"+author.id, {
		method: "GET",
		headers: {
			"Authorization": Rsa
		}
	});

	if (!req.ok) return {
		today: 0,
		daily_quota: values.MaxOut.ImagineTaskLimit,
		last_timestamp: now_time
	}

	const imagine_c = (await req.json() as OwnResponsePayload).d as Imagine;
	const isOver = now_time >= Number(imagine_c.lastImaginationTime);
	
	if (isOver)
	{
		fetch(ServerUrl + "/v1/database/imagine/" + author.id, {
			method: "DELETE",
			headers: {
				"Authorization": Rsa
			}
		});
		
		return {
			today: 0,
			daily_quota: values.MaxOut.ImagineTaskLimit,
			last_timestamp: Number(imagine_c.lastImaginationTime)
		}
	}
	
	return {
		today: Array.from(imagine_c?.imagination ?? ["0"]).length,
		daily_quota: values.MaxOut.ImagineTaskLimit,
		last_timestamp: Number(imagine_c.lastImaginationTime)
	}
}

export async function makeOneImage(images: RawFile[]): Promise<Buffer>
{
	if (images.length !== 4) return images[0].data as Buffer;

	const makeOverlay = async () => {
		var res: Sharp.OverlayOptions[] = [];
		
		for (let i = 0; i < images.length; i++)
		{
			res.push({
				input: await Sharp(images[i].data as Buffer).resize({
					width: 256,
					height: 256,
					fit: "contain"
				}).toBuffer(),
				top: coordinates[i][1],
				left: coordinates[i][0],
				gravity: "northwest",
			});
		}
		
		return res;
	}
	const coordinates = [
		[0, 0], [256, 0],
		[0, 256], [256, 256]
	]
	const canvas = Sharp({
		create: {
			width: 512,
			height: 512,
			channels: 4,
			background: { r: 255, g: 255, b: 255, alpha: 0.0 }
		}
	}).png();
	
	return await canvas.composite(await makeOverlay()).toBuffer();
}

export async function storeInStorage(generated: RawFile[], upscaled: boolean = false, data?: APIMessage): Promise<APIMessage>
{
	if (!upscaled) return await res.post(Routes.channelMessages(DiscordChannelStorage), {
		files: generated
	}) as APIMessage;
	else {
		var getParentMessage = await res.get(Routes.channelMessage(DiscordChannelStorage, data?.id as string)) as APIMessage;
		let thread = getParentMessage?.thread;
		
		if (!thread) thread = await res.post(Routes.threads(DiscordChannelStorage, data?.id as string), {
			body: {
				name: "upscaled"
			}
		}) as APIChannel;
		
		return await res.post(Routes.channelMessages(thread?.id as string), {
			files: generated
		}) as APIMessage;
	}
}

export async function update_metadata(author: APIUser, generatedUrl: string): Promise<void>
{
	const doreq = async (method: string, payload: unknown, ex: string) => {
		return await fetch(ServerUrl+"/v1/database"+ex, {
			method,
			headers: {
				"Authorization": Rsa,
				"Content-Type": "application/json"
			},
			body: JSON.stringify(payload)
		});
	}
	
	let update_data = await doreq("PATCH", {
		$push: {
			imagination: generatedUrl
		}
	}, `/imagine/${author.id}`);
	
	const localMidnight = new Date();
	localMidnight.setDate(localMidnight.getDate() + 1) // add 1 to get the next day's date
	localMidnight.setHours(0); // set the clock to midnight at 00:00
	localMidnight.setMinutes(0);
	localMidnight.setSeconds(0);
	localMidnight.setMilliseconds(0);
	
	if (update_data.status === HttpStatusCode.NOT_FOUND) update_data = await doreq("POST", {
		_id: author.id,
		lastImaginationTime: localMidnight.getTime(),
		imagination: [generatedUrl]
	}, "/imagine");
}

export function load_model(generation_data: { model: string, prompt?: string; negative_prompt?: string }): PredictionRequestJson
{
	if (!generation_data.model) generation_data.model = available_models._default.name;
	if (!(generation_data.model in available_models)) return {
		exist: false,
		model: generation_data.model
	};

	const selected_model = available_models[generation_data.model as keyof typeof available_models] as PredictionRequestJson;
	selected_model.default = { ...selected_model.default, ...available_models._default._ };
	selected_model.exist = true;
	selected_model.model = generation_data.model;

	if ("prompt" in selected_model.default && generation_data.prompt) selected_model.default.prompt = generation_data.prompt;
	if ("negative_prompt" in selected_model.default && generation_data.negative_prompt) selected_model.default.negative_prompt =  generation_data.negative_prompt;
	
	return selected_model;
}

export async function show_original_image(interaction: APIInteraction, message_id: string, image_id: string): Promise<void>
{
	try
	{
		const get_message = await res.get(Routes.channelMessage(DiscordChannelStorage, message_id)) as APIMessage;
		const original_image = get_message.attachments?.filter((attachment: APIAttachment) => attachment.filename.startsWith(`result-${Number(image_id)+1}`))[0];

		if (original_image) fetch(original_image.url).then(async (res: Response) => {
			respond(interaction, {
				type: InteractionResponseType.ChannelMessageWithSource,
				data: {}
			}, [
				{
					data: Buffer.from(await res.arrayBuffer()),
					name: original_image.filename,
					contentType: original_image.content_type
				}
			]);
		});
	}
	catch (e: unknown)
	{
		logger.error(e)
	}
}