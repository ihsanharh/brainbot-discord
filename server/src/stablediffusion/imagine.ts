import { fetch, Response } from 'undici';

import * as Cache from "../managers/Cache";
import { Integer } from "../constants/values";
import { edit_original_response, delete_original_response, storeInStorage, check_prediction, makeOneImage, followup_message, update_metadata } from "./addition";
import { SdUrl } from "../utils/config";
import { b64toab } from "../utils/functions";
import { APIButtonComponentWithCustomId, APIMessage, APIUser, CheckPredictionType, MessageFlags, PredictionObject } from "../typings";
import logger from "../services/logger";

export const ModelPath = "ai-forever/kandinsky-2.2";
export const ModelVersion: string = "ea1addaab376f4dc227f5368bbd8eff901820fd1cc14ed8cad63b29249e9d463";

/**
 * generate an image
 */
export async function generate(prompt: string, author: APIUser, token: string, limits: number): Promise<void>
{ 
	// send POST to the gpu server
	fetch(SdUrl, {
		method: "POST",
		headers: {
			"Accept": "application/json",
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			model: ModelPath,
			version: ModelVersion,
			input: {
				height: 512,
				width: 512,
				num_inference_steps: 75,
                num_inference_steps_prior: 25,
				prompt,
				num_outputs: 4
			}
		})
	}).then(async (res: Response) => {
		if (!res.ok)
		{
			logger.warn(res, "Error with the gpu server");
			edit_original_response(token, {
				body: {
					content: "Something went wrong, The imagination was cancelled."
				}
			});
			
			return;
		}

		let prediction = await res.json() as PredictionObject;
		const predictionStatus = ['canceled', 'succeeded', 'failed'];
		var generated: {data:Buffer;name:string;contentType:string;}[] = [];
		var upscaleButtons: APIButtonComponentWithCustomId[] = [];
		let currPred: CheckPredictionType = {
			prediction
		};
		
		edit_original_response(token, {
			body: {
				content: `**${prompt}** - <@${author?.id}> (${prediction.status})`
			}
		});
		
		// wait for the status to become one of predictionStatus
		while (!predictionStatus.includes(prediction.status))
		{
			currPred = await check_prediction(token, currPred);
			prediction = currPred.prediction as PredictionObject;
		}
		
		Cache.remove(`imagine_${author?.id}`);
		
		if (prediction.status === "cancelled")
		{
			edit_original_response(token, {
				body: {
					content: "The imagination was cancelled."
				}
			});
			
			return;
		}
		else if (prediction.status === "failed")
		{
			edit_original_response(token, {
				body: {
					content: "Failed to imagine your imagination."
				}
			})
			
			return;
		}
		
		if (!prediction?.output || prediction.output && prediction.output.length < 1) return;
		
		for (let i = 0; i < prediction?.output?.length; i++)
		{
			let contentType = String(prediction?.output[i].url).substring(String(prediction?.output[i].url).lastIndexOf(".")+1);
			
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
			
			update_metadata(author, data.id);
			delete_original_response(token);
			followup_message(token, {
				body: {
					content: `**${prompt}** - <@${author?.id}> (Completed in ${prediction.metrics.predict_time}s.) [${limits+1}/${Integer.ImagineTaskLimit}]`,
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
	}).catch(async (err: unknown) => {
		Cache.remove(`imagine_${author?.id}`);
		logger.warn(err, "gpu server failed to imagine");
		edit_original_response(token, {
			body: {
				content: `I can't imagine your prompt because my GPU is heated right now ={. Try again later!`,
				flags: MessageFlags.Ephemeral
			}
		});
	});
}