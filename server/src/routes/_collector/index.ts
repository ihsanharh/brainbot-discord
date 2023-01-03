import { Request, Response, Router, json } from 'express';

import { HttpStatusCode } from "../../typings";
import { verifyPrivateRouting } from "../../utils/middleware";
import { ActiveCollector, createCollector, collected, setMessage } from "../../managers/Collector";

const CollectorRoute: Router = Router();

CollectorRoute.use(json());

CollectorRoute.get("/_active", verifyPrivateRouting, async (req: Request, res: Response) => {
	if (ActiveCollector.size >= 1) return res.status(HttpStatusCode.OK).json({
		"active": [...Array.from(ActiveCollector.keys())]
	});
	else return res.status(HttpStatusCode.NOT_FOUND).end();
});

CollectorRoute.post("/collect", verifyPrivateRouting, async (req: Request, res: Response) => {
	collected(JSON.parse(req.body?.data), JSON.parse(req.body?.interaction));
	return res.status(HttpStatusCode.OK).end();
});

CollectorRoute.post("/message", verifyPrivateRouting, async (req: Request, res: Response) => {
	setMessage(req.body?.state, JSON.parse(req.body?.message));
	return res.status(HttpStatusCode.OK).end();
});

CollectorRoute.post("/new", verifyPrivateRouting, async (req: Request, res: Response) => {
	createCollector(req.body);
	return res.status(HttpStatusCode.OK).end();
});

export { CollectorRoute };