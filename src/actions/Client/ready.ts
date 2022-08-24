import { Client } from 'discord.js';

import BotStatusUpdater, { CleanUp } from "../../helpers/botStatus";

export default (client: Client): void => {
	BotStatusUpdater(client);
	CleanUp();
	
	const ShardId: number = client?.shard?.ids[0] ?? 0;
	const BotStatus = client?.user?.presence?.status;
	
	console.log(`[Shard ${ShardId}] ${client?.user?.username} is ${BotStatus}.`);
}
