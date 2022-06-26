export default (client: any) => {
	console.log(`[Shard ${client.shard.ids[0]}] ${client.user.username} is ${client?.user?.presence?.status}.`);
}
