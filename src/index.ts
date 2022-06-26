require('dotenv').config({
    path: __dirname.substring(0, __dirname.lastIndexOf("/")) + "/.env"
});
require("./utils/error");

import { ShardingManager } from 'discord.js';

import { ShardsCount } from "./utils/config"

const TOKEN: string = process.env.NODE_ENV === "production" ? process.env.PROD_TOKEN : process.env.DEV_TOKEN;
const MainFile: string = process.env.NODE_ENV === "production" ? "./dist/brainbot.js" : "./src/brainbot.ts";

const manager = new ShardingManager(MainFile, {
	respawn: true,
	token: TOKEN
});

manager.on('shardCreate', (shard: any) => {
	shard.on('death', (process: any) => {
		console.log(`[Manager] Shard ${shard.id} exiting`);
	});
	
	shard.on('spawn', (process: any) => {
		console.log(`[Manager] Launched Shard ${shard.id}`);
	});
});

manager.spawn({ amount: ShardsCount, timeout: 60000 });
