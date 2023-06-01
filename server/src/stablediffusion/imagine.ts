import { fetch, Response } from 'undici';

import * as Cache from "../managers/Cache";
import { delete_original_response, storeInStorage, makeOneImage, followup_message } from "./addition";
import { DiscordAppId, SdUrl } from "../utils/config";
import { b64toab } from "../utils/functions";
import { res } from "../utils/res";
import { APIButtonComponentWithCustomId, APIMessage, APIUser, HttpStatusCode, Routes } from "../typings";

export const ModelPath: string = "ai-forever/kandinsky-2";
export const ModelVersion: string = "601eea49d49003e6ea75a11527209c4f510a93e2112c969d548fbb45b9c4f19f";

export async function generate(prompt: string, author: APIUser, token: string): Promise<void>
{
	fetch(SdUrl[0], {
		method: "POST",
		headers: {
			"Authorization": "brainbotstablediffusion-1",
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			model: `${ModelPath}:${ModelVersion}`,
			prompt: prompt,
			batch_size: 4,
			guidance_scale: 6,
			t: token,
			asbuffer: true,
		})
	}).then(async (prediction: any) => {
		if (prediction?.status === HttpStatusCode.NO_CONTENT || prediction.status === HttpStatusCode.INTERNAL_SERVER_ERROR)
		{
			delete_original_response(token);
			followup_message(token, {
				body: {
					content: "Something went wrong={, The imagination was cancelled."
				}
			});
			return;
		}
		
		prediction = await prediction.json();
		var generated: {data:Buffer;name:string;contentType:string;}[] = [];
		var upscaleButtons: APIButtonComponentWithCustomId[] = [];
		
		await Cache.remove(`imagine_${author?.id}`);
		if (!prediction?.output) return;
		
		for (let i = 0; i < prediction?.output?.length; i++)
		{
			let contentType = String(prediction?.output[i].url).substr(String(prediction?.output[i].url).lastIndexOf(".")+1);
			
			generated.push({
				data: Buffer.from(b64toab(prediction.output[i].data)),
				name: `result-${i+1}.${contentType}`,
				contentType
			});
		}
		
		storeInStorage(generated).then(async (data: APIMessage) => {
			for (let i = 0; i < data.attachments.length; i++)
			{
				upscaleButtons.push({
					type: 2,
					style: 2,
					label: `U${i+1}`,
					custom_id: `imagine_upscale;${data.id}.${i}`
				})
			}
			
			delete_original_response(token);
			followup_message(token, {
				body: {
					content: `**${prompt}** - <@${author?.id}> (Completed.)`,
					components: [
						{
							type: 1,
							components: upscaleButtons,
						},
					]
				},
				files: [
					{
						data: await makeOneImage(generated),
						name: `results.png`,
						contentType: "png",
					},
				],
			});
		});
	});
}