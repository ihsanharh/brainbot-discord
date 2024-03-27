import * as path from 'node:path';

import { APIInteraction, APIMessage, CollectorData } from "../typings";
import redis from "../services/redis";

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
 * // IMPORTANT: to make the collect event work you have to include the colector state in every custom_id of your components.
 * // e.g. button_help.collectorstate
 *
 * // listen to the end of collector life, similar to collect event
 * export function collectorEnd(data: CollectorData) {
 *   // do something...
 * }
 * // NOTE: to make collect and end function work as expected, make sure you provided valid path of your file to pwd option when creating collector.
 * // see help command file for actual usage.
 */

export async function _active_collector(): Promise<Map<string, string>>
{
	const collectors = new Map();

	for await (const key of redis.scanIterator({ MATCH: "clr0*", COUNT: 100 }))
	{
		const collector = await redis.GET(key);
		collectors.set(key, collector);
	}

	return collectors;
}

export async function collector_sub(): Promise<void>
{
	const collector_subscriber = redis.duplicate();
	await collector_subscriber.connect();

	await collector_subscriber.PSUBSCRIBE("*expired", async (message: any, channel: any) => {
		if (message.startsWith("clrs0"))
		{
			const get_expired_collector = await redis.GET(message.replace("clrs0", "clr0"));
			if (get_expired_collector) _end(JSON.parse(get_expired_collector) as CollectorData);
		}
	});
}

async function _end(data: CollectorData): Promise<void>
{
	const pwd = path.resolve(data.pwd, data.name);
	const CommandFile = await import(pwd);
	
	if (CommandFile && CommandFile._collectorEnd)
	{
		const getlatestData = await redis.GET("clr0" + data.id);
		var latestData: CollectorData;
		
		if (!getlatestData) return;
		latestData = JSON.parse(getlatestData) as CollectorData;
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
}

export async function createCollector(data: CollectorData): Promise<void>
{
	redis.PSETEX("clrs0" + data.id, Number(data.time), "0");
	redis.PSETEX("clr0" + data.id, Number(Number(data.time) + 10000), JSON.stringify(data));
}

export async function collected(data: CollectorData, interaction: APIInteraction): Promise<void>
{
	const currentTTL = await redis.PTTL("clr0" + data.id);
	const currentData = await redis.GET("clr0" + data.id);
	
	if (currentData)
	{
		const newData = JSON.parse(currentData);
		
		if (Array.isArray(newData?.collected)) newData?.collected.push(interaction);
		else Object.defineProperty(newData, "collected", {
			value: [interaction],
			enumerable: true
		});

		if (data.expand) redis.PSETEX("clrs0" + data.id, Number(data.time), "0");
		redis.PSETEX("clr0" + newData.id, data.expand? Number(data.time) + 10000: currentTTL, JSON.stringify(newData));
	}
}

export async function setMessage(state: string, message: APIMessage): Promise<void>
{
	const currentData = await redis.GET(state);

	if (currentData)
	{
		const newData = JSON.parse(currentData);
		
		Object.defineProperty(newData, "message", {
			value: message,
			enumerable: true
		});

		redis.PSETEX(state, Number(newData.time), JSON.stringify(newData));
	}
}