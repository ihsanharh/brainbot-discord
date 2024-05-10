import { Request, Response, Router, json } from 'express';

import { HttpStatusCode } from "../../types/http";
import { OwnResponsePayloadType } from "../../typings";

import { asOwnResponse } from "../../services/own";
import redis from "../../services/redis";

/**
 * Route for caching on redis, used by worker thread on handling discord interactions,
 * its quite simple, just storing key-value in redis
 * 
 * GET /cache/somekey
 * POST /cache/somekey/somevalue
 * DELETE /cache/somekey
 * 
 * somekey is required and is a string
 * somevalue is optional and is a string, if somevalue is not provided, the key will have "0" as the value
 */

const CacheRoute: Router = Router();

CacheRoute.use(json());

/**
 * get key and return its value as string
 * Optional: check for Key-Expired-In-Seconds headers for remaining key ttl
 */
CacheRoute.get("/:key", async (req: Request, res: Response) => {
	let statusCode = HttpStatusCode.NOT_FOUND, d, m = "Common.NotFound";
	const { key } = req.params;
	
	let getKey = await redis.GET(String(key));
	let ttl = await redis.TTL(key);
	
	if (Number(ttl) >= 1) res.set("Key-Expired-In-Seconds", String(ttl))
	if (getKey)
	{
		d = getKey;
		statusCode = HttpStatusCode.OK;
		m = "Common.Found";
	}
	
	return res.status(statusCode).json(
		asOwnResponse([`${statusCode}`], OwnResponsePayloadType.CACHE, m, d)
	);
});

/**
 * store a key-value pair, the value can be anything, but will be converted to string
 * the ttl request body must be in seconds
 * return status code ACCEPTED, otherwise bad request
 */
CacheRoute.post("/:key/:value?", async (req: Request, res: Response) => {
	let statusCode = HttpStatusCode.ACCEPTED, d, m = "Common.Accepted";
	const { key, value } = req.params;
	const { ttl } = req.body;
	
	try {
		const lvalue = value? value: 0;
		
		if (ttl || ttl && !isNaN(ttl))
		{
			if (ttl > 1) redis.SETEX(String(key), Number(ttl), String(lvalue));
			else
			{
				statusCode = HttpStatusCode.BAD_REQUEST;
				m = "Cache.GreaterThanOneTtl";
			}
		}
		else
		{
			redis.SET(String(key), String(lvalue));
		}
	} catch (e: unknown) {
		d = e;
	}
	
	return res.status(statusCode).json(
		asOwnResponse([`${statusCode}`], OwnResponsePayloadType.CACHE, m, d)
	);
});

/**
 * delete key, don't wait for this request to complete, we don't care if the key being deleted exist or not.
 * but it will be deleted.
 */
CacheRoute.delete("/:key", async (req: Request, res: Response) => {
	let statusCode = HttpStatusCode.OK, m = "Common.Accepted";
	const { key } = req.params;
	
	redis.DEL(String(key));
	
	return res.status(statusCode).json(
		asOwnResponse([`${statusCode}`], OwnResponsePayloadType.CACHE, m)
	);
});

export default CacheRoute;