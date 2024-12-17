import { Request, Response, Router } from 'express';
import { Worker } from 'node:worker_threads';
import * as express from 'express';

import { HttpStatusCode } from "../../types/http";

import { getAllApplicationCommands } from "../../managers/ApplicationCommand";
import { _active_collector } from "../../managers/Collector";
import { verifyDiscordRequest } from "./verify";

const InteractionRoute: Router = express.Router();

InteractionRoute.use(express.json({
	verify: verifyDiscordRequest()
}));

InteractionRoute.post("/", async (req: Request, res: Response) => {
	res.status(HttpStatusCode.ACCEPTED).end();

	inhandler(req.body);
});

async function inhandler(interaction: unknown): Promise<void> {
	const collectors = await _active_collector();

	new Worker(__dirname.replace("routes/_interaction", "interaction/handler"), {
		workerData: {
			collectors,
			interaction: JSON.stringify(interaction),
			commands: JSON.stringify(await getAllApplicationCommands())
		}
	});
}

export { InteractionRoute };