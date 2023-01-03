import * as express from 'express';
import { Request, Response, Router } from 'express';
import { Worker } from 'node:worker_threads';

import { APIInteractionResponse, HttpStatusCode } from "../../typings";
import { verifyDiscordRequest } from "./verify";
import { ActiveCollector } from "../../managers/Collector";

const InteractionRoute: Router = express.Router();

InteractionRoute.use(express.json({
	verify: verifyDiscordRequest()
}));

InteractionRoute.post("/", (req: Request, res: Response) => {
	const thread = new Worker(__dirname.replace("routes/_interaction", "interaction/handler"), {
		workerData: {
			collectors: JSON.stringify(Array.from(ActiveCollector)),
			interaction: JSON.stringify(req.body)
		}
	});
	
	thread.on('message', (message: APIInteractionResponse) => {
		res.status(HttpStatusCode.OK).send(message);
	});
	
	thread.once('exit', (code: number) => res.status(HttpStatusCode.FORBIDDEN).end());
});

export { InteractionRoute };