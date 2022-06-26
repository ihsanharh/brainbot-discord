export default (error: any, shardId: number) => {
	console.log(`[Shard ${shardId}] encounters a connection error`);
}
