import { Request, Response, Router } from 'express';

import { APIApplicationCommand } from 'discord-api-types/v10'; 
import { HttpStatusCode } from "../../types/http";

import { validateOwner } from "../../utils/middleware";
import { getAllApplicationCommands, refreshCommands } from "../../managers/ApplicationCommand";

const CommandsRoute: Router = Router();

CommandsRoute.get("/", async (req: Request, res: Response) => {
	const FetchComands: APIApplicationCommand[] | null = await getAllApplicationCommands();
	
	if (FetchComands)
	{
		return res.status(HttpStatusCode.OK).json(JSON.parse(JSON.stringify(FetchComands)));
	}
	else
	{
		return res.status(HttpStatusCode.NOT_FOUND).json({ "message": `${HttpStatusCode.NOT_FOUND}: no commands found.` });
	}
});

CommandsRoute.get("/update", validateOwner, async (req: Request, res: Response) => {
	refreshCommands();
	
	return res.status(HttpStatusCode.ACCEPTED).json({ "message": `${HttpStatusCode.ACCEPTED} Check logs.` });
});

export { CommandsRoute };