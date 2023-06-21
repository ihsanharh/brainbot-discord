import { fetch } from 'undici';
import * as Sharp from 'sharp';

import { DiscordAppId, DiscordChannelStorage, Rsa, ServerUrl } from "../utils/config";
import { res } from "../utils/res";
import { HttpStatusCode } from "../utils/types/http";
import { APIChannel, APIMessage, APIUser, Routes } from "../typings";

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

export async function limits(author: APIUser): Promise<number[]>
{
	const req = await fetch(ServerUrl+"/v1/database/imagine/"+author.id, {
		method: "GET",
		headers: {
			"Authorization": Rsa
		}
	});
	const json_body = await req.json() as any;
	const isOver = Number(json_body?.d?.lastImaginationTime) <= new Date().getTime();
	
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
	
	if (update_data.status === HttpStatusCode.NOT_FOUND) update_data = await doreq("POST", {
		_id: author.id,
		lastImaginationTime: new Date().getTime() + 86400000,
		imagination: [generatedUrl]
	}, "/imagine");
}