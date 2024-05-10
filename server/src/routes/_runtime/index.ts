import { Request, Response, Router, json } from 'express';

import { HttpStatusCode } from "../../types/http";

import redis from "../../services/redis";

const RuntimeRoute: Router = Router();

RuntimeRoute.use(json());

RuntimeRoute.get("/guild-count", async (req: Request, res: Response) => {
	let guild_count = 0;

	for await (const shard of redis.scanIterator({
		TYPE: "string",
		MATCH: "shard_*:guild_count",
		COUNT: 100
	}))
	{
		const get_guild_count: string|null = await redis.get(shard);
		if (get_guild_count) guild_count += Number(get_guild_count);
	}

	return res.status(HttpStatusCode.OK).json({
		count: guild_count
	});
});

RuntimeRoute.get("/session-count", async (req: Request, res: Response) => {
	let count = 0;

	for await (const session of redis.scanIterator({
		TYPE: "string",
		MATCH: "session*",
		COUNT: 100
	}))
	{
		count++;
	}

	return res.status(HttpStatusCode.OK).json({
		count
	});
});

export { RuntimeRoute };