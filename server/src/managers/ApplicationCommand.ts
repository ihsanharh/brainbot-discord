import { APIApplicationCommand, PermissionFlagsBits, Routes } from 'discord-api-types/v10'; 
import { command_metadata } from "../typings";
import * as fs from 'node:fs';

import { res } from "../utils/res";
import { DiscordAppId } from "../utils/config";
import { from_string } from "../utils/permissions";
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
		logger.info(`Command ${created_application_command.name} has been created.`);
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
		logger.info(`Command ${application_command.name} has been deleted.`);
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
		logger.info(`Command ${updated_application_command.name} has been updated.`);
	}
	catch(error: unknown)
	{
		logger.error(error);
	}
}

/**
 * refresh application commands
 * @return {void}
*/
export function refreshCommands(): void
{
	fs.readdir(__dirname.replace("managers", "interaction/commands"), (err: unknown, files: string[]) => {
		if (err) throw err;

		files.map((file: string) => file.substring(0, file.length-3)).filter((file: string) => file !== "base").forEach(async (file: string, index: number, files: string[]) => {
			const existing_commands = await getAllApplicationCommands();
			const local_command = (new (await import(`../interaction/commands/${file}`)).default()).get_json();
			console.log(local_command)
			
			local_command.default_member_permissions = String(from_string(local_command.default_member_permissions));
			console.log("err")
			if (existing_commands && existing_commands?.length >= 1)
			{
				const exist_ = existing_commands?.find((command: APIApplicationCommand) => command.name === local_command.name)
				const no_longer_exist = existing_commands.every((command: APIApplicationCommand) => files.includes(command.name));
				
				if (exist_) updateApplicationCommand(exist_, local_command);
				console.log(no_longer_exist)
			}
			else
			{
				createApplicationCommand(local_command._applicationCommand);
			}
		});
	});
}