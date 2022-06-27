export default (shardId: number, unavailableGuilds: any) => {
	if (unavailableGuilds) return console.log(`[Shard ${shardId}] turns ready with ${unavailableGuilds.size} unavailable guilds`);
	
	console.log(`[Shard ${shardId}] turns ready`);
}
