import { APIApplicationCommand, Routes, command_metadata } from "../typings";
import { res } from "../utils/res";
import { DiscordAppId } from "../utils/config";

export const ApplicationCommandsCache: Map<string, APIApplicationCommand> = new Map<string, APIApplicationCommand>();

export async function createApplicationCommand(application_command: command_metadata): Promise<void>
{
	try
	{
		const created_application_command: APIApplicationCommand = await res.post(Routes.applicationCommands(DiscordAppId), {
			body: application_command
		}) as APIApplicationCommand;
		
		ApplicationCommandsCache.set(created_application_command.id, created_application_command);
	}
	catch(error: unknown)
	{
		console.error(error);
	}
}

export async function deleteApplicationCommand(application_command: APIApplicationCommand): Promise<void>
{
	try
	{
		await res.delete(Routes.applicationCommand(DiscordAppId, application_command.id));
		
		ApplicationCommandsCache.delete(application_command.id);
	}
	catch(error: unknown)
	{
		console.error(error);
	}
}

export async function getAllApplicationCommands(): Promise<APIApplicationCommand[]|null>
{
	try
	{
		if (ApplicationCommandsCache.size >= 1)
		{
			return Array.from(ApplicationCommandsCache.values()) as APIApplicationCommand[];
		}
		else
		{
			const FetchedCommands: APIApplicationCommand[] = await res.get(Routes.applicationCommands(DiscordAppId)) as APIApplicationCommand[];
			FetchedCommands.forEach((application_command: APIApplicationCommand) => ApplicationCommandsCache.set(application_command?.id, application_command));
			
			return FetchedCommands;
		}
	}
	catch
	{
		return null;
	}
}

export async function updateApplicationCommand(application_command: APIApplicationCommand, new_application_command: command_metadata): Promise<void>
{
	try
	{
		const updated_application_command: APIApplicationCommand = await res.patch(Routes.applicationCommand(DiscordAppId, application_command?.id), {
			body: new_application_command
		}) as APIApplicationCommand;
		
		ApplicationCommandsCache.set(updated_application_command.id, updated_application_command);
	}
	catch(error: unknown)
	{
		console.error(error);
	}
}