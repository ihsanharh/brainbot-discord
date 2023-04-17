import { Request, Response, Router, json } from 'express';

import { HttpStatusCode } from "../../typings";
import { verifyPrivateRouting } from "../../utils/middleware";
import { _set, _delete, Cache } from "../../managers/Cache";

const CacheRoute: Router = Router();

CacheRoute.use(json());

CacheRoute.get("/", async (req: Request, res: Response) => {
	const { key } = req.query;
	if (!key) return res.status(HttpStatusCode.UNAUTHORIZED).end();
	
	const getCd = Cache.get(String(key));
	if (getCd) return res.status(HttpStatusCode.OK).json(getCd);
	else return res.status(HttpStatusCode.NOT_FOUND).json({ "nothing found": "0" });
});

CacheRoute.post("/", async (req: Request, res: Response) => {
	var { key, value } = req.query;
	if (!key) return res.status(HttpStatusCode.UNAUTHORIZED).end();
	if (!value) value = "value";
	
	const getCd = Cache.get(String(key));
	if (getCd) return res.status(HttpStatusCode.NOT_FOUND).json({ "already exist": "0" });
	else
	{
		_set(String(key), value);
		return res.status(HttpStatusCode.OK).end();
	}
});

CacheRoute.delete("/", async (req: Request, res: Response) => {
	const { key } = req.query;
	if (!key) return res.status(HttpStatusCode.UNAUTHORIZED).end();
	
	const getCd = Cache.get(String(key));
	if (getCd)
	{
		_delete(String(key));
		return res.status(HttpStatusCode.OK).end();
	}
	else return res.status(HttpStatusCode.NOT_FOUND).json({ "not existed": "0" });
});

export { CacheRoute };