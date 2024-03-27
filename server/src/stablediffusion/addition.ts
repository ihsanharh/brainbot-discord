import { fetch } from 'undici';
import * as Sharp from 'sharp';

import { Dev, DiscordAppId, DiscordChannelStorage, Rsa, SdUrl, ServerUrl } from "../utils/config";
import { res } from "../utils/res";
import { HttpStatusCode } from "../utils/types/http";
import { APIChannel, APIMessage, APIUser, CheckPredictionType, MessageFlags, PredictionObject, Routes } from "../typings";

export async function edit_original_response(token: string, payload: any, message_id?: string): Promise<unknown>
{
	try
	{
		return await res.patch(Routes.webhookMessage(DiscordAppId, token, message_id??"@original"), payload);
	} catch (e: unknown) {
		return e;
	}
}

export async function delete_original_response(token: string): Promise<unknown>
{
	try
	{
		return await res.delete(Routes.webhookMessage(DiscordAppId, token)).then((r) => {}).catch((err) => {});
	}
	catch(e: unknown) {
		return e;
	}
}

export async function delete_followup_message(token: string, message_id: string): Promise<unknown>
{
	try
	{
		return await res.delete(Routes.webhookMessage(DiscordAppId, token, message_id));
	}
	catch(e: unknown)
	{
		return e;
	}
}

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
	});

	let prediction = await get_pred.json() as PredictionObject;
	let helpful_m, tensec_m;
	
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
		
		if (now_time >= 10000 && !currPred.tensec_m)
		{
			/**
			 * if the status hasnt been updated in 10 secs, send a follow up message.
			 */
			tensec_m = await followup_message(token, {
				body: {
					content: "The server is undergoing a restart after a period of inactivity. This process may require a few minutes, and your patience is appreciated.",
					flags: MessageFlags.Ephemeral
				}
			}) as APIMessage;
		}
		else if (now_time >= 30000 && !currPred.helpful_m)
		{
			/**
			 * here we do checking if the starting status is longer than 30 secs
			 * incase the server is down, just to let the user know.
			 */
			const preset_messages = [
				"This is taking a bit longer than expected, but I'm making progress!",
				"I'm just double-checking some things, will do the task for you shortly.",
				"This might require a little extra research, I'll get back to you as soon as I know more."
			];

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
		helpful_m,
		tensec_m
	};
}

export async function followup_message(token: string, payload: any): Promise<unknown>
{
	try
	{
		return await res.post(`${Routes.webhook(DiscordAppId, token)}?wait=true`, payload);
	}
	catch (e: unknown) {
		return e;
	}
}

export async function limits(author: APIUser): Promise<number[]>
{
	if (author.id === Dev) return [0, new Date().getTime()];

	const req = await fetch(ServerUrl+"/v1/database/imagine/"+author.id, {
		method: "GET",
		headers: {
			"Authorization": Rsa
		}
	});
	const json_body = await req.json() as any;
	const isOver = new Date().getTime() >= Number(json_body?.d?.lastImaginationTime);
	
	if (isOver || req.status === HttpStatusCode.NOT_FOUND)
	{
		fetch(ServerUrl+"/v1/database/imagine/"+author.id, {
			method: "DELETE",
			headers: {
				"Authorization": Rsa
			}
		});
		
		return [0, json_body?.d?.lastImaginationTime];
	}
	
	return [Array.from(json_body?.d?.imagination).length, json_body?.d?.lastImaginationTime];
}

export async function makeOneImage(images: any): Promise<Buffer>
{
	const makeOverlay = async () => {
		var res: any = [];
		
		for (let i = 0; i < images.length; i++)
		{
			res.push({
				input: await Sharp(images[i].data).resize({
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

export async function storeInStorage(generated: any, upscaled: boolean = false, data?: any): Promise<APIMessage>
{
	if (!upscaled) return await res.post(Routes.channelMessages(DiscordChannelStorage), {
		files: generated
	}) as APIMessage;
	else {
		var getParentMessage = await res.get(Routes.channelMessage(DiscordChannelStorage, data.id)) as APIMessage;
		let thread = getParentMessage?.thread;
		
		if (!thread) thread = await res.post(Routes.threads(DiscordChannelStorage, data.id), {
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