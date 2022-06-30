import BotStatusUpdater from "../../helpers/botStatus";

export default async (client: any) => {
	console.log(`[Shard ${client.shard.ids[0]}] ${client.user.username} is ${client?.user?.presence?.status}.`);
	BotStatusUpdater(client);
}
