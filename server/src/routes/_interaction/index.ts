import { Request, Response, Router } from 'express';
import { Worker } from 'node:worker_threads';
import * as express from 'express';

import { APIInteractionResponse } from 'discord-api-types/v10';
import { HttpStatusCode } from "../../types/http";

import { getAllApplicationCommands } from "../../managers/ApplicationCommand";
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
			interaction: JSON.stringify(req.body),
			commands: JSON.stringify(await getAllApplicationCommands())
		}
	});
	
	thread.on('message', (message: APIInteractionResponse) => res.status(HttpStatusCode.OK).send(message));
});

export { InteractionRoute };