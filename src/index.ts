require('dotenv').config({
    path: __dirname.substring(0, __dirname.lastIndexOf("/")) + "/.env"
});
require("./utils/error");

import { ShardingManager } from 'discord.js';

import { BotToken, MainFile, ShardsCount } from "./utils/config"
import { AvatarUrl, sendDWebhook } from "./utils";
import Colors from "./utils/colors";
import Emojis from "./utils/emojis";

const manager = new ShardingManager(MainFile, {
	respawn: true,
	token: BotToken
});

manager.on('shardCreate', (shard: any) => {
	shard.on('death', () => {
		console.log(`[Manager] Shard ${shard.id} exiting`);
		
		sendDWebhook({
			embeds: [
				{
					description: `${Emojis["message"]} **Shard ${shard.id}** process was exited.`,
					color: Colors["red.Status"],
					footer: {
						text: `${shard.manager.shards.size}/${shard.manager.totalShards}`
					}
				}
			],
			username: "Brain Bot",
			avatarURL: AvatarUrl
		}, process.env.SHARD_WEBHOOK);
	});
	
	shard.on('spawn', () => {
		console.log(`[Manager] Launched Shard ${shard.id}`);
		
		sendDWebhook({
			embeds: [
				{
					description: `${Emojis["message"]} **Shard ${shard.id}** has been spawned.`,
					color: Colors["green.Success"],
					footer: {
						text: `${shard.manager.shards.size}/${shard.manager.totalShards}`
					}
				}
			],
			username: "Brain Bot",
			avatarURL: AvatarUrl
		}, process.env.SHARD_WEBHOOK);
	});
});

manager.spawn({ amount: ShardsCount, timeout: 60000 });
