import { Worker } from 'node:worker_threads';
import * as express from 'express';

import { APIInteraction } from 'discord-api-types/v10';
import { Request, Response, Router } from 'express';
import { HttpStatusCode } from "../../types/http";
import { Action } from '../../typings';

import { getAllApplicationCommands } from "../../managers/ApplicationCommand";
import { _active_collector } from "../../managers/Collector";
import { verifyInteraction } from "./verify";

const InteractionRoute: Router = express.Router();

InteractionRoute.post("/", verifyInteraction(), async (req: Request, res: Response) => {
	res.status(HttpStatusCode.ACCEPTED).end();

	inhandler(req.body);
});

async function inhandler(interaction: APIInteraction): Promise<void> {
	const collectors = await _active_collector();

	new Worker(__dirname.replace("routes/_interaction", "interaction/handler"), {
		workerData: {
			collectors,
			interaction: interaction,
			commands: await getAllApplicationCommands()
		}
	}).on("message", (message: Action) => {
		console.log(message);
	});
}

export { InteractionRoute };