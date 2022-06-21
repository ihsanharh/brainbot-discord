import { BotLogsChannel } from "../../utils/config";
import Emoji from "../../utils/emojis";

export default async (guild: any, client: any) => {
	const LoggingChannel: any = await client.channels.fetch(BotLogsChannel, { force: true, allowUnknownGuild: true });
	
	if (LoggingChannel) LoggingChannel.send({ content: `${Emoji["leave"]} has been kicked from **${guild?.name}\n[${client.guilds.cache.size}]**` });
}
