import { fetch } from 'undici';

import { followup_message, storeInStorage } from "./addition";
import { DiscordAppId, DiscordChannelStorage, SdUrl } from "../utils/config";
import { b64toab } from "../utils/functions";
import { res } from "../utils/res";
import { APIButtonComponentWithCustomId, APIInteraction, APIMessage, APIUser, MessageFlags, Routes } from "../typings";

export const ModelPath: string = "nightmareai/real-esrgan";
export const ModelVersion: string = "42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b";

export async function upscaler(interaction: APIInteraction, selectedComponents: APIButtonComponentWithCustomId, dataId: string, imageIndex: number, checked?: boolean): Promise<void>
{
	res.get(Routes.channelMessage(DiscordChannelStorage, dataId)).then(async (data: any) => {
		var user: APIUser = interaction?.member?.user ?? interaction?.user as APIUser;
		var prompt = String(interaction.message?.content).substr(0, String(interaction.message?.content).lastIndexOf("-"));
		
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
						    content: `${prompt} - Upscaled by <@${user.id}>`,
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
				  scale: 4,
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
			  
			  storeInStorage(files, true, data);
			  res.delete(Routes.webhookMessage(DiscordAppId, interaction?.token, followupMessage?.id));
			  followup_message(interaction?.token, {
				  body: {
					  content: `${prompt} - Upscaled by <@${user.id}>`,
				  },
				  files
			  });
		  });
		});
	}).catch(console.log);
}