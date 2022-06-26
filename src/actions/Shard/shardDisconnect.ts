export default (closeEvent: any, shardId: number) => {
	console.log(`[Shard ${shardId}] disconnects and will no longer reconnect`);
	console.log(closeEvent)
}
