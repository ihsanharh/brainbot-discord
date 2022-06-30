import { BotLogsChannel } from "../../utils/config";
import BotStatusUpdater from "../../helpers/botStatus";
import Emoji from "../../utils/emojis";

export default async (guild: any, client: any) => {
	BotStatusUpdater(client);
	const LoggingChannel: any = await client.channels.fetch(BotLogsChannel, { force: true, allowUnknownGuild: true });
	
	if (LoggingChannel) {
		const GuildsCount = (await client.shard.fetchClientValues("guilds.cache.size")).reduce((prev: any, val: any) => prev + val, 0);
		
		LoggingChannel.send({ content: `${Emoji["leave"]} has been kicked from **${guild?.name}\n[${GuildsCount}]**` });
	}
}
