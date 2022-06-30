import { DefaultPrefix } from "../../utils"
import { BotLogsChannel } from "../../utils/config";
import BotStatusUpdater from "../../helpers/botStatus";
import Database from "../../database";
import Emoji from "../../utils/emojis";

export default async (guild: any, client: any) => {
	BotStatusUpdater(client);
	const LoggingChannel: any = await client.channels.fetch(BotLogsChannel, { force: true, allowUnknownGuild: true });
	const clientCommands = client.commands.filter((c: any) => !c.permission.author.includes("OWNER"));
	const GetGuildData = await Database({
		collection: "chat",
		method: "find",
		query: { _id: guild.id }
	});
	
	guild.commands.set(clientCommands);
	
	guild.channels.fetch().then(async (GuildChannels: any) => {
		const filterChannel = GuildChannels.filter((channel: any) => channel.type === "GUILD_TEXT" && channel.permissionsFor(client.user).has(["SEND_MESSAGES", "VIEW_CHANNEL"]));
		
		if (filterChannel.size >= 1) {
			let firstTime = `\n\nYou can start by DM-ing me or Do \` ${DefaultPrefix}setup \` to set me up. Use \` ${DefaultPrefix}help \` to display the help menu.`
			
			if (GetGuildData) {
				let prefix = GetGuildData?.prefix || DefaultPrefix
				let ThanksAdBack = "Oh hi again! Thanks for adding me back <3";
				
				if (GetGuildData.channel !== null) {
					const GetTheChannel = await guild.channels.fetch(GetGuildData.channel, { force: true });
					
					if (GetTheChannel) ThanksAdBack += `\n\nYou can continue talking to me in ${GetTheChannel} or run \` ${prefix}setup \` to change the channel.`
					else ThanksAdBack += firstTime
				} else {
					ThanksAdBack += firstTime
				}
				
				return filterChannel.first().send({ content: `${ThanksAdBack}` })
			} else {
				return filterChannel.first().send({ content: `Hey! Brain Bot's here, I'm an **AI-Powered** Chat Bot. Thanks for adding me to your server!\n\n${firstTime}` });
			}
		}
	});
	
	if (LoggingChannel) {
		const GuildsCount = (await client.shard.fetchClientValues("guilds.cache.size")).reduce((prev: any, val: any) => prev + val, 0);
		
		LoggingChannel.send({ content: `${Emoji["join"]} has been added to **${guild?.name}\n[${GuildsCount}]**` });
	}
}
