import { fetch, Response } from 'undici';

import * as Cache from "../managers/Cache";
import { followup_message, delete_followup_message, limits, storeInStorage, check_prediction, update_metadata } from "./addition";
import { Integer } from "../constants/values";
import { DiscordChannelStorage, SdUrl } from "../utils/config";
import { b64toab } from "../utils/functions";
import { res as DiscordAPI } from "../utils/res";
import { APIButtonComponentWithCustomId, APIInteraction, APIMessage, APIUser, CheckPredictionType, MessageFlags, PredictionObject, Routes } from "../typings";
import logger from "../services/logger";

export const ModelPath = "jingyunliang/swinir";
export const ModelVersion: string = "660d922d33153019e8c263a3bba265de882e7f4f70396546b6c9c8f9d47a021a";

export async function upscaler(interaction: APIInteraction, selectedComponents: APIButtonComponentWithCustomId, dataId: string, imageIndex: number, checked?: boolean): Promise<void>
{
	var user: APIUser = interaction?.member?.user ?? interaction?.user as APIUser;
	const rate_limits: number[] = await limits(user);
	
	if (rate_limits[0] >= Integer.ImagineTaskLimit)
	{
		followup_message(interaction?.token, {
			body: {
				content: `Due to extreme demand, The Imagine command (including the upscaler) is limited to ${Integer.ImagineTaskLimit} uses per day. You'll be able to use it again <t:${Math.floor(rate_limits[1]/1000)}:R>`,
				flags: MessageFlags.Ephemeral
			}
		});

		return;
	}
	else if (await Cache.has(`imagine_${user.id}`))
	{
		followup_message(interaction.token, {
			body: {
				content: "`You have one task in progress. Please wait for its completion.`",
				flags: MessageFlags.Ephemeral
			}
		});

		return;
	};

	/**
	 * check wether the image has been upscaled before, take it from the data if present otherwise upscale it
	 */
	Cache.set(`imagine_${user.id}`, `${Date.now()}`, Integer.ImagineTaskTimeout);
	DiscordAPI.get(Routes.channelMessage(DiscordChannelStorage, dataId)).then(async (data: any) => {
		var prompt = String(interaction.message?.content).substring(0, String(interaction.message?.content).lastIndexOf("-"));
		
		if (!checked && data?.thread)
		{
			DiscordAPI.get(Routes.channelMessages(data?.thread.id)).then((upscaled_images: any) => {
				var this_upscaled_data = upscaled_images.filter((images: any) => images?.attachments[0]?.filename === `image-${imageIndex+1}.png`);
				if (this_upscaled_data.length < 1) upscaler(interaction, selectedComponents, dataId, imageIndex, true);
				else
				{
					var this_upscaled_images = this_upscaled_data[0]?.attachments[0];
					fetch(this_upscaled_images?.url).then(async (res) => {
						followup_message(interaction?.token, {
							body: {
						    content: `${prompt} - Upscaled by <@${user.id}> [${rate_limits[0]}/${Integer.ImagineTaskLimit}]`,
					    },
					    files: [
					    	{
					    		data: Buffer.from(await res.arrayBuffer()),
					    		name: this_upscaled_images.filename,
					    		contentType: this_upscaled_images.contentType
					    	}
					    ]
					  });
					});
				};
			});
		}
		
		const followupMessage = await followup_message(interaction?.token, {
			body: {
				content: `Upscalling image **#${imageIndex+1}** with ${prompt} - (Upscalling by 4x)`
			}
		}) as APIMessage;
		
		fetch(SdUrl, {
			method: "POST",
			headers: {
				"Accept": "application/json",
				"Content-Type": "application/json",
				"Include-B64": "true"
			},
			body: JSON.stringify({
				model: ModelPath,
				version: ModelVersion,
				input: {
					image: data.attachments[imageIndex].url,
				    jpeg: 40,
				    noise: 15,
				    task_type: "Real-World Image Super-Resolution-Large"
				}
			}),
		}).then(async (res: Response) => {
			let prediction = await res.json() as PredictionObject;
			const predictionStatus = ["succeeded", "failed", 'cancelled'];
			var currPred: CheckPredictionType = {
				prediction
			};

			while (!predictionStatus.includes(prediction.status))
			{
				currPred = await check_prediction(interaction.token, currPred, followupMessage?.id);
				prediction = currPred.prediction as PredictionObject;
			}

			Cache.remove(`imagine_${user.id}`);
			delete_followup_message(interaction.token, followupMessage?.id);

			if (prediction.status === "cancelled")
			{
				followup_message(interaction.token, {
					body: {
						content: "The upscale task was cancelled",
						flags: MessageFlags.Ephemeral
					}
				});

				return;
			}
			else if (prediction.status === "failed")
			{
				followup_message(interaction.token, {
					body: {
						content: "Failed to upscale the requested image.",
						flags: MessageFlags.Ephemeral
					}
				});

				return;
			}

			let contentType = String(prediction?.output[0].url).substring(String(prediction?.output[0].url).lastIndexOf(".")+1);
			let files = [
				{
					data: Buffer.from(b64toab(prediction?.output[0].data)),
					name: `image-${imageIndex+1}.${contentType}`,
					contentType
				}
			];
			
			storeInStorage(files, true, data).then((msg: APIMessage) => {
				update_metadata(user, msg.id);
			});
			followup_message(interaction?.token, {
				body: {
					content: `${prompt} - Upscaled by <@${user.id}> [${rate_limits[0]+1}/${Integer.ImagineTaskLimit}]`,
				},
				files
			});
		});
	}).catch((reason: unknown) => logger.error(reason));
}