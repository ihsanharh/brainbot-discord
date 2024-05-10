import { fetch, Response } from 'undici';

import { APIButtonComponentWithCustomId, APIInteraction, APIMessage, APIUser, MessageFlags, Routes } from 'discord-api-types/v10';
import { CheckPredictionType, CollectorData, PredictionLimit, PredictionObject } from "../typings";

import { parse_command } from "../interaction/commands/base";
import { followup_message, delete_followup_message } from "../interaction/interaction";
import { DiscordChannelStorage, SdUrl } from "../utils/config";
import { b64toab } from "../utils/functions";
import { res as DiscordAPI } from "../utils/res";
import { limits, storeInStorage, check_prediction, update_metadata } from "./addition";
import * as Cache from "../managers/Cache";
import logger from "../services/logger";

import * as values from "../constants/values.json";

export const ModelPath = "anotherjesse/real-esrgan-a40";
export const ModelVersion: string = "cafc802d5eda91d12812340eb20c35f3358e8398b750f54845dba74c82a3bef0";

export async function collectorCollect(data: CollectorData, interaction: APIInteraction): Promise<void>
{
	console.log(data)
}

export async function upscaler(interaction: APIInteraction, selectedComponents: APIButtonComponentWithCustomId, dataId: string, imageIndex: number, checked?: boolean): Promise<void>
{
	var user: APIUser = interaction?.member?.user ?? interaction?.user as APIUser;
	const rate_limits: PredictionLimit = await limits(user);
	
	if (typeof rate_limits.daily_quota === "number" && rate_limits.today >= rate_limits.daily_quota)
	{
		followup_message(interaction?.token, {
			body: {
				content: parse_command(values.commands.imagine.limit_reached, [], String(rate_limits.daily_quota), `<t:${Math.round(rate_limits.last_timestamp/1000)}>`),
				flags: MessageFlags.Ephemeral
			}
		});

		return;
	}
	else if (await Cache.has(`imagine_${user.id}`))
	{
		followup_message(interaction.token, {
			body: {
				content: values.commands.imagine.calmdown,
				flags: MessageFlags.Ephemeral
			}
		});

		return;
	};

	/**
	 * check wether the image has been upscaled before, take it from the data if present otherwise upscale it
	 */
	Cache.set(`imagine_${user.id}`, `${Date.now()}`, values.TimeOut.ImagineTaskTimeout);
	DiscordAPI.get(Routes.channelMessage(DiscordChannelStorage, dataId)).then(async (message: unknown) => {
		const data = typeof message === "object"? message as APIMessage : null;
		var prompt = String(interaction.message?.content).substring(0, String(interaction.message?.content).lastIndexOf("-"));

		if (!data)
		{
			followup_message(interaction.token, {
				body: {
					content: values.commands.imagine.no_output,
					flags: MessageFlags.Ephemeral
				}
			});

			return;
		}

		if (!checked && data?.thread)
		{
			DiscordAPI.get(Routes.channelMessages(data?.thread.id)).then((messages_in_thread: unknown) => {
				const upscaled_images = typeof messages_in_thread === "object"? messages_in_thread as APIMessage[] : null;
				
				if (upscaled_images && upscaled_images.length >= 1)
				{
					var this_upscaled_data = upscaled_images.filter((images: APIMessage) => images?.attachments[0]?.filename === `image-${imageIndex+1}.png`);

					if (this_upscaled_data.length < 1) upscaler(interaction, selectedComponents, dataId, imageIndex, true);
					else
					{
						var this_upscaled_images = this_upscaled_data[0]?.attachments[0];
						fetch(this_upscaled_images?.url).then(async (res) => {
							followup_message(interaction?.token, {
								body: {
							    content: parse_command(values.commands.imagine.upscale.upscaled_by, [], user.id, String(rate_limits.today+1), String(rate_limits.daily_quota)),
						    },
						    files: [
						    	{
						    		data: Buffer.from(await res.arrayBuffer()),
						    		name: this_upscaled_images.filename,
						    		contentType: this_upscaled_images.content_type
						    	}
						    ]
						  });
						});
					};
				};
			});
		}
		
		const followupMessage = await followup_message(interaction?.token, {
			body: {
				content: parse_command(values.commands.imagine.upscale.upscaling, [], String(imageIndex+1), prompt)
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
					face_enhance: true,
					image: data.attachments[imageIndex].url,
					scale: 4
				}
			}),
		}).then(async (res: Response) => {
			if (!res.ok)
			{
				logger.warn(res, "Error with the server");
				Cache.remove(`imagine_${user?.id}`);
				followup_message(interaction.token, {
					body: {
						content: values.commands.imagine.server_not_ok,
						flags: MessageFlags.Ephemeral
					}
				});
				
				return;
			}

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

			if (prediction.error)
			{
				followup_message(interaction.token, {
					body: {
						content: prediction.error,
						flags: MessageFlags.Ephemeral
					}
				});
	
				return;
			}

			if (prediction.status === "cancelled")
			{
				followup_message(interaction.token, {
					body: {
						content: values.commands.imagine.upscale.cancelled,
						flags: MessageFlags.Ephemeral
					}
				});

				return;
			}
			else if (prediction.status === "failed")
			{
				followup_message(interaction.token, {
					body: {
						content: values.commands.imagine.upscale.failed,
						flags: MessageFlags.Ephemeral
					}
				});

				return;
			}

			if (!prediction.output || prediction.output.length < 1)
			{
				followup_message(interaction.token, {
					body: {
						content: values.commands.imagine.no_output,
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
					content: parse_command(values.commands.imagine.upscale.upscaled_by, [], user.id, String(rate_limits.today+1), String(rate_limits.daily_quota)),
				},
				files
			});
		});
	}).catch((reason: unknown) => logger.error(reason));
}