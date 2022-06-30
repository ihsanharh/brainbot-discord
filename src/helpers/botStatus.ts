import Database from "../database";

export default async (client: any) => {
	let BotStatus = await Database({
		collection: "bot",
		method: "find",
		query: { id: client.user.id }
	});
	
	if (!BotStatus) {
		BotStatus = await Database({
			collection: "bot",
			method: "create",
			values: {
				id: client.user.id
			}
		});
	}
	
	const CheckIfCurrentShardExist = BotStatus.shards.filter((shard: any) => shard.shardId === client.shard.ids[0]);
	
	if (CheckIfCurrentShardExist) {
		await Database({
			collection: "bot",
			method: "update",
			query: { id: client.user.id },
			values: {
				$pull: { shards: {
					shardId: client.shard.ids[0]
				}}
			}
		}).then(async () => {
			let userCount = 0;
			
			client.guilds.cache.forEach((guild: any) => {
				userCount += guild.memberCount;
			});
			
			await Database({
				collection: "bot",
				method: "update",
				query: { id: client.user.id },
				values: {
					$push: { shards: {
						shardId: client.shard.ids[0],
						ping: client.ws.ping,
						users: userCount,
						guilds: client.guilds.cache.size
					}}
				}
			})
		})
	}
}
