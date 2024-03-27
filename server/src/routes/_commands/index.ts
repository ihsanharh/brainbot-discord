import * as fs from 'fs';
import { NextFunction, Request, Response, Router } from 'express';

import { APIApplicationCommand, HttpStatusCode } from "../../typings";
import { Rsa } from "../../utils/config";
import { createApplicationCommand, deleteApplicationCommand, getAllApplicationCommands, updateApplicationCommand } from "../../managers/ApplicationCommand";

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

CommandsRoute.get("/update", async (req: Request, res: Response, next: NextFunction) => {
	const { auth } = req.query;
	
	if (!auth || auth !== Rsa) return res.status(HttpStatusCode.UNAUTHORIZED).end();
	else return next();
}, async (req: Request, res: Response) => {
	var existing_application_commands: APIApplicationCommand[] | null = await getAllApplicationCommands();
	const available_commands = fs.readdirSync(__dirname.replace("routes/_commands", "interaction/commands"))
	.map((available_command: string) => available_command.substring(0, available_command.length-3))
	.filter((available_command: string) => !available_command.includes("base"));
	
	available_commands.forEach(async (command_file: string) => {
		if (!existing_application_commands) existing_application_commands = [];
		const struct_command = new (await import(`../../interaction/commands/${command_file}`)).default();
		
		if (existing_application_commands.length >= 1)
		{
			const map_existing_commands: string[] = existing_application_commands
			.map((application_command: APIApplicationCommand) => application_command?.name);
			
			if (map_existing_commands.includes(struct_command?.name))
			{
				const get_command_availability = existing_application_commands.filter((application_command: APIApplicationCommand) => application_command.name === struct_command?.name)[0];
				console.log(`Updated ${struct_command.name} command.`);
				updateApplicationCommand(get_command_availability, struct_command._applicationCommand);
			}
			else
			{
				console.log(`ACreated ${struct_command.name} command.`);
				createApplicationCommand(struct_command._applicationCommand);
			}
		}
		else
		{
			console.log(`NCreated ${struct_command.name} command.`);
			createApplicationCommand(struct_command._applicationCommand);
		}
	});
	
	if (existing_application_commands !== null && existing_application_commands.length >= 1) existing_application_commands
	.filter((deleted_command: APIApplicationCommand) => !available_commands.includes(deleted_command.name))
	.forEach((deleted_command: APIApplicationCommand) => {
		console.log(`Deleted ${deleted_command.name} command.`);
		deleteApplicationCommand(deleted_command);
	});
	
	return res.status(HttpStatusCode.ACCEPTED).json({ "message": `${HttpStatusCode.ACCEPTED} Check logs.` });
});

export { CommandsRoute };