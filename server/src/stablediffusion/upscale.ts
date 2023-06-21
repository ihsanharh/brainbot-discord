import { fetch } from 'undici';

import { followup_message, limits, storeInStorage, update_metadata } from "./addition";
import { DiscordAppId, DiscordChannelStorage, ImagineLimits, SdUrl } from "../utils/config";
import { b64toab } from "../utils/functions";
import { res } from "../utils/res";
import { APIButtonComponentWithCustomId, APIInteraction, APIMessage, APIUser, MessageFlags, Routes } from "../typings";

export const ModelPath: string = "jingyunliang/swinir";
export const ModelVersion: string = "660d922d33153019e8c263a3bba265de882e7f4f70396546b6c9c8f9d47a021a";

export async function upscaler(interaction: APIInteraction, selectedComponents: APIButtonComponentWithCustomId, dataId: string, imageIndex: number, checked?: boolean): Promise<void>
{
	res.get(Routes.channelMessage(DiscordChannelStorage, dataId)).then(async (data: any) => {
		var user: APIUser = interaction?.member?.user ?? interaction?.user as APIUser;
		var prompt = String(interaction.message?.content).substr(0, String(interaction.message?.content).lastIndexOf("-"));
		const rate_limits: number = await limits(user);
		
		if (!checked && data?.thread) {
			res.get(Routes.channelMessages(data?.thread.id)).then((upscaled_images: any) => {
				var this_upscaled_data = upscaled_images.filter((images: any) => images?.attachments[0]?.filename === `image-${imageIndex+1}.png`);
				if (this_upscaled_data.length < 1) upscaler(interaction, selectedComponents, dataId, imageIndex, true);
				else
				{
					var this_upscaled_images = this_upscaled_data[0]?.attachments[0];
					fetch(this_upscaled_images?.url).then(async (res) => {
						followup_message(interaction?.token, {
							body: {
						    content: `${prompt} - Upscaled by <@${user.id}> [${rate_limits[0]}/${ImagineLimits}]`,
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
		else if (rate_limits[0] >= ImagineLimits) return followup_message(interaction?.token, {
			body: {
				content: `Due to extreme demand, The imagine command including upscaler is limited to ${ImagineLimits} uses per day. You'll be able to use it again <t:${Math.floor(rate_limits[1]/1000)}:R>`,
				flags: MessageFlags.Ephemeral
			}
		})
		else followup_message(interaction?.token, {
			body: {
				content: `Upscalling image **#${imageIndex+1}** with ${prompt} - (Upscalling by 4x)`,
				flags: MessageFlags.Ephemeral
			}
		}).then(async (followupMessage: any) => {
			fetch(SdUrl[1], {
				method: "POST",
				headers: {
					"Authorization": "brainbotstablediffusion-1",
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					model: `${ModelPath}:${ModelVersion}`,
					image: data.attachments[imageIndex].url,
				  noise: 15,
				  asbuffer: true,
			  }),
		  }).then(async (prediction: any) => {
			  prediction = await prediction.json();
			  let contentType = String(prediction?.output.url).substr(String(prediction?.output.url).lastIndexOf(".")+1);
			  let files = [
			  	{
			  		data: Buffer.from(b64toab(prediction.output.data)),
						name: `image-${imageIndex+1}.${contentType}`,
						contentType
				  }
			  ];
			  
			  storeInStorage(files, true, data).then((msg: APIMessage) => {
			  	update_metadata(user, msg.id);
			  });
			  res.delete(Routes.webhookMessage(DiscordAppId, interaction?.token, followupMessage?.id));
			  followup_message(interaction?.token, {
				  body: {
					  content: `${prompt} - Upscaled by <@${user.id}> [${rate_limits[0]+1}/${ImagineLimits}]`,
				  },
				  files
			  });
		  });
		}).catch((err: unknown) => {
			followup_message(interaction?.token, {
				body: {
					content: `I can't upscale the requested image because my gpu is heated right now ={. Try again later!`,
					flags: MessageFlags.Ephemeral
				}
			})
		});
	}).catch(console.log);
}