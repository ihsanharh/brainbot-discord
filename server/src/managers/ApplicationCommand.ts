import { APIApplicationCommand, Routes, command_metadata } from "../typings";
import { res } from "../utils/res";
import { DiscordAppId } from "../utils/config";
import redis from "../services/redis";
import logger from "../services/logger";

/**
 * @description - Commands Manager, used to register, delete or update an application command
 */

/**
 * create a application command to discord
 * @param {command_metadata} application_command - command metadata
 * @return {void}
 */
export async function createApplicationCommand(application_command: command_metadata): Promise<void>
{
	try
	{
		const created_application_command: APIApplicationCommand = await res.post(Routes.applicationCommands(DiscordAppId), {
			body: application_command
		}) as APIApplicationCommand;
		
		redis.HSET("commands", created_application_command.id, JSON.stringify(created_application_command));
	}
	catch(error: unknown)
	{
		logger.error(error);
	}
}

/**
 * delete application command from discord
 * @param {APIApplicationCommand} application_command + the application command
 * @return {void}
 */
export async function deleteApplicationCommand(application_command: APIApplicationCommand): Promise<void>
{
	try
	{
		await res.delete(Routes.applicationCommand(DiscordAppId, application_command.id));
		
		redis.HDEL("commands", application_command.id);
	}
	catch(error: unknown)
	{
		logger.error(error);
	}
}

/**
 * get all available application commands
 * @return {APIApplicationCommand[]|null} An array of APIApplicationCommand or null
 */
export async function getAllApplicationCommands(): Promise<APIApplicationCommand[]|null>
{
	try
	{
		/**
		 * check for cache first and return from cache if possible
 		*/
		const cached_commands: APIApplicationCommand[] = [];
		
		for await (const { field, value } of redis.hScanIterator("commands"))
		{
			cached_commands.push(JSON.parse(value) as APIApplicationCommand);
		}
		
		if (cached_commands.length >= 1)
		{
			return cached_commands;
		}
		else
		{
			/**
			 * fetch the commands if there's no cache available
 			*/
			const FetchedCommands: APIApplicationCommand[] = await res.get(Routes.applicationCommands(DiscordAppId)) as APIApplicationCommand[];
			FetchedCommands.forEach((application_command: APIApplicationCommand) => redis.HSET("commands", application_command?.id, JSON.stringify(application_command)));
			
			return FetchedCommands;
		}
	}
	catch (e: unknown)
	{
		logger.error(e);
		return null;
	}
}

/**
 * update specific application command
 * @param {APIApplicationCommand} application_command - command to update
 * @return {void}
 */
export async function updateApplicationCommand(application_command: APIApplicationCommand, new_application_command: command_metadata): Promise<void>
{
	try
	{
		const updated_application_command: APIApplicationCommand = await res.patch(Routes.applicationCommand(DiscordAppId, application_command?.id), {
			body: new_application_command
		}) as APIApplicationCommand;
		
		redis.HSET("commands", updated_application_command.id, JSON.stringify(updated_application_command));
	}
	catch(error: unknown)
	{
		logger.error(error);
	}
}