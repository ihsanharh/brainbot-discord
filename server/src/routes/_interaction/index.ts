import * as express from 'express';
import { Request, Response, Router } from 'express';
import { Worker } from 'node:worker_threads';

import { APIInteractionResponse, HttpStatusCode } from "../../typings";
import { _active_collector } from "../../managers/Collector";
import { verifyDiscordRequest } from "./verify";

const InteractionRoute: Router = express.Router();

InteractionRoute.use(express.json({
	verify: verifyDiscordRequest()
}));

InteractionRoute.post("/", async (req: Request, res: Response) => {
	const collectors = await _active_collector();

	const thread = new Worker(__dirname.replace("routes/_interaction", "interaction/handler"), {
		workerData: {
			collectors,
			interaction: JSON.stringify(req.body)
		}
	});
	
	thread.on('message', (message: APIInteractionResponse) => {
		return res.status(HttpStatusCode.OK).send(message);
	});
	
	thread.once('exit', (code: number) => res.status(HttpStatusCode.FORBIDDEN).end());
});

export { InteractionRoute };