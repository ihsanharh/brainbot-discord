require('dotenv').config({
    path: __dirname.substring(0, __dirname.lastIndexOf("/")) + "/.env"
});
require("./utils/error");

import { ShardingManager } from 'discord.js';

import { ShardsCount } from "./utils/config"
import { AvatarUrl, sendDWebhook } from "./utils";
import Colors from "./utils/colors";

const TOKEN: string = process.env.NODE_ENV === "production" ? process.env.PROD_TOKEN : process.env.DEV_TOKEN;
const MainFile: string = process.env.NODE_ENV === "production" ? "./dist/brainbot.js" : "./src/brainbot.ts";

const manager = new ShardingManager(MainFile, {
	respawn: true,
	token: TOKEN
});

manager.on('shardCreate', (shard: any) => {
	shard.on('death', () => {
		console.log(`[Manager] Shard ${shard.id} exiting`);
		
		sendDWebhook({
			embeds: [
				{
					description: `<:message:889864012060303431> **Shard ${shard.id}** process was exited.`,
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
					description: `<:message:889864012060303431> **Shard ${shard.id}** has been spawned.`,
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
