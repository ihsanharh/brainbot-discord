export default (shardId: number, unavailableGuilds: any) => {
	console.log(`[Shard ${shardId}] turns ready`);
	
	if (unavailableGuilds) console.log(`[Shard ${shardId}] has ${unavailableGuilds.size} unavailable guilds`);
}
