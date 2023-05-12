import * as Sharp from 'sharp';

import { DiscordAppId, DiscordChannelStorage } from "../utils/config";
import { res } from "../utils/res";
import { APIChannel, APIMessage, Routes } from "../typings";

export async function delete_original_response(token: string): Promise<any>
{
	try
	{
		return await res.delete(Routes.webhookMessage(DiscordAppId, token)).then((r) => {}).catch((err) => {});
	}
	catch(e: unknown) {}
}

export async function followup_message(token: string, payload: {body:{[k:string]:any;};files?:any;}): Promise<any>
{
	try
	{
		var { body, files } = payload;
		
		if (!files) files = [];
		
		return await res.post(Routes.webhook(DiscordAppId, token), {
			body,
			files,
			auth: false,
		});
	}
	catch (e: unknown) {}
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