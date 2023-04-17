import * as path from 'node:path';

import { APIInteraction, APIMessage, CollectorData } from "../typings";

/* Message Components Collector */
/* used for collecting interaction from discord with message components type
 * currently this collector is only usable in external thread.
 * you have to specify working directory and the caller's file need to export collectorCollect and collectorEnd function.
 * • to be implemented: support main thread
 * • example of usage:
 * // to create collector do an http POST request to collector endpoints on this server
 * fetch("http://server.com/_collector/new", {
 *   method: "POST",
 *   body: {
 *     ...options // see CollectorData interface in typings.ts for reference
 *   }
 * }); // when you do this request, the collector get created. you can just listen to collect and end event like below
 * 
 * // to listen to collect event, you need to import collectorCollect function from the file where you create this collector.
 * export function collectorCollect(data: CollectorData, interaction: Interaction) {
 *   // do something...
 * }
 *
 * // listen to the end of collector life, similar to collect event
 * export function collectorEnd(data: CollectorData) {
 *   // do something...
 * }
 * // NOTE: to make collect and end function work as expected, make sure you provided valid path of your file to pwd option when creating collector.
 * // see help command file for actual usage.
 */

export const ActiveCollector: Map<string, CollectorData> = new Map<string, CollectorData>();

async function _out(data: CollectorData): Promise<void>
{
	setTimeout(() => {
		_end(data);
	}, Number(data.time));
}

export async function _collect(data: CollectorData, interaction: APIInteraction): Promise<void>
{
	const pwd = path.resolve(data.pwd, data.name);
	const CommandFile = await import(pwd);
	
	if (CommandFile && CommandFile._collectorCollect) CommandFile._collectorCollect(data, interaction);
}

async function _end(data: CollectorData): Promise<void>
{
	const pwd = path.resolve(data.pwd, data.name);
	const CommandFile = await import(pwd);
	
	if (CommandFile && CommandFile._collectorEnd)
	{
		
		const latestData = ActiveCollector.get(data.id);
		
		if (!latestData) return;
		if (!latestData?.collected)
		{
			Object.defineProperty(latestData, "collected", {
				value: [],
				enumerable: true
			});
		}
		
		if (!latestData?.message && latestData?.collected)
		{
			const message_from_interaction = (latestData?.collected as APIInteraction[])[0]?.message as APIMessage;
			
			Object.defineProperty(latestData, "message", {
				value: message_from_interaction,
				enumerable: true
			});
		}
		
		CommandFile._collectorEnd(latestData);
	}
	
	ActiveCollector.delete(data.id);
}

export async function createCollector(data: CollectorData): Promise<void>
{
	ActiveCollector.set(data.id, data);
	_out(data);
}

export async function collected(data: CollectorData, interaction: APIInteraction): Promise<void>
{
	const currentData = ActiveCollector.get(data.id);
	
	if (currentData)
	{
		const newData = { ...currentData };
		
		if (Array.isArray(newData?.collected)) newData?.collected.push(interaction);
		else Object.defineProperty(newData, "collected", {
			value: [interaction],
			enumerable: true
		});
		
		ActiveCollector.set(currentData.id, newData);
	}
}

export async function setMessage(state: string, message: APIMessage): Promise<void>
{
	const currentData = ActiveCollector.get(state);
	
	if (currentData)
	{
		const newData = { ...currentData };
		
		Object.defineProperty(newData, "message", {
			value: message,
			enumerable: true
		});
		
		ActiveCollector.set(currentData.id, newData)
	}
}