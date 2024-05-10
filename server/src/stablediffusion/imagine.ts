import { RawFile } from '@discordjs/rest';
import { fetch, Response } from 'undici';
import { nanoid } from 'nanoid';

import { APIButtonComponentWithCustomId, APIMessage, APIUser, ComponentType, MessageFlags } from 'discord-api-types/v10';
import { CheckPredictionType, PredictionLimit, PredictionObject, PredictionRequestJson } from "../typings";

import { parse_command } from "../interaction/commands/base";
import { edit_original_response, delete_original_response, followup_message, delete_followup_message } from "../interaction/interaction";
import { Rsa, SdUrl } from "../utils/config";
import { b64toab } from "../utils/functions";
import { storeInStorage, check_prediction, makeOneImage, update_metadata, load_model } from "./addition";
import * as Cache from "../managers/Cache";
import logger from "../services/logger";

import * as values from "../constants/values.json";

/**
 * generate an image
 */
export async function generate(model: PredictionRequestJson, author: APIUser, token: string, limits: PredictionLimit, no_prompt?: APIMessage, safe_work?: string): Promise<void>
{
	// send POST to the gpu server
	fetch(SdUrl, {
		method: "POST",
		headers: {
			"Accept": "application/json",
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			model: model.tag_name,
			version: model.version,
			input: model.default
		})
	}).then(async (res: Response) => {
		if (!res.ok)
		{
			logger.warn("Error with the server");
			logger.warn(res.text());
			console.log(res)
			Cache.remove(`imagine_${author?.id}`);
			edit_original_response(token, {
				body: {
					content: values.commands.imagine.server_not_ok
				}
			});
			
			return;
		}

		let prediction = await res.json() as PredictionObject;
		const predictionStatus = ['canceled', 'succeeded', 'failed'];
		var generated: RawFile[] = [];
		var showButtons: APIButtonComponentWithCustomId[] = [];
		let currPred: CheckPredictionType = { prediction };
		
		if (!safe_work) edit_original_response(token, {
			body: {
				content: parse_command(values.commands.imagine.predict_status, [], model.default?.prompt as string, author?.id, prediction.status)
			}
		});
		if (no_prompt) delete_followup_message(token, no_prompt.id);
		
		// wait for the status to become one of predictionStatus
		while (!predictionStatus.includes(prediction.status))
		{
			currPred = await check_prediction(token, currPred);
			prediction = currPred.prediction as PredictionObject;
		}
		
		Cache.remove(`imagine_${author?.id}`);

		if (prediction.error || currPred.nsfw_found)
		{
			if (typeof prediction.error === "string" && prediction.error.toLowerCase().includes("nsfw") || currPred.nsfw_found)
			{
				const select_safe_work = values.commands.imagine.nsfw_detected[Math.floor(Math.random() * values.commands.imagine.nsfw_detected.length)];
				const re_reselect_model = load_model({ model: model.model, prompt: select_safe_work.new_prompt });

				generate(re_reselect_model, author, token, limits, undefined, select_safe_work.message);

				return;
			}
			
			delete_original_response(token);
			followup_message(token, {
				body: {
					content: prediction.error,
					flags: MessageFlags.Ephemeral
				}
			});

			return;
		}
		
		if (prediction.status === "cancelled")
		{
			edit_original_response(token, {
				body: {
					content: values.commands.imagine.cancelled
				}
			});
			
			return;
		}
		else if (prediction.status === "failed")
		{
			edit_original_response(token, {
				body: {
					content: values.commands.imagine.failed
				}
			})
			
			return;
		}
		
		if (!prediction?.output || prediction.output && prediction.output.length < 1)
		{
			edit_original_response(token, {
				body: {
					content: values.commands.imagine.no_output
				}
			});

			return;
		};
		
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
				showButtons.push({
					type: ComponentType.Button,
					style: 2,
					label: `U${i+1}`,
					custom_id: `show_result;${data.id};${i}`
				})
			}
			
			update_metadata(author, data.id);
			delete_original_response(token);
			followup_message(token, {
				body: {
					content: parse_command(values.commands.imagine.predict_status + `[${limits.today+1}/${limits.daily_quota}]`, [], model.default?.prompt as string, author.id, `Completed in ${Math.round(prediction.metrics.predict_time)}s.`),
					components: [
						{
							type: ComponentType.ActionRow,
							components: showButtons,
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
			if (safe_work) followup_message(token, {
				body: {
					content: safe_work,
					flags: MessageFlags.Ephemeral
				}
			});
		});
	}).catch(async (err: unknown) => {
		Cache.remove(`imagine_${author?.id}`);
		logger.warn(err, "gpu server failed to imagine");
		edit_original_response(token, {
			body: {
				content: values.commands.imagine.error,
				flags: MessageFlags.Ephemeral
			}
		});
	});
}