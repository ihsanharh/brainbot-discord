import { createClient } from 'redis';

import { RedisUrl } from "../utils/config";
import { collector_sub } from "../managers/Collector";
import logger from "./logger";

const redis = createClient({
	url: RedisUrl
});

(async function() {
	await redis.connect();
})();

redis.on('connect', async () => {
	logger.info("Connecting to redis");
});

redis.on('ready', async () => {
	logger.info("Redis connected");
	collector_sub();
});

redis.on('end', async () => {
	logger.info("Redis ended");
});

redis.on('reconnecting', async () => {
	logger.info("Redis reconnecting");
});

redis.on('error', async (error: Error) => {
	logger.error("Failed to connect to redis\n"+error);
});

export default redis;