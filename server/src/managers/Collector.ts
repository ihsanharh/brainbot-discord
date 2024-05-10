import * as path from 'node:path';

import { APIInteraction, APIMessage, ComponentType } from 'discord-api-types/v10'; 
import { CollectorData } from "../typings";

import redis from "../services/redis";
import logger from "../services/logger";

/* Message Components Collector */
/* used for collecting interaction from discord with message components type
 * currently this collector is only usable in external thread.
 * you have to specify working directory and the caller's file need to export collectorCollect and collectorEnd function.
 * • to be implemented: support main thread
 * • example of usage:
 * // let collId = "my_collector"; //or use nanoid()
 * 
 * // to create collector do an http POST request to collector endpoints on this server
 * fetch("http://server.com/_collector/new", {
 *   method: "POST",
 *   body: {
 *     id: collId, // after the last dot(.) is the collector identifier, it should be unique. 
 *     file: "file_name.js" // name of the file where the collectorCollect function exported
 *     pwd: "path/to/your/file", // path to your file
 *     ...options // see CollectorData interface in typings.ts for reference
 *   }
 * }); // when you do this request, the collector get created. you can just listen to collect and end event like below
 * 
 * // to listen to collect event, you need to import collectorCollect function from the file you specified in the file options.
 * export function collectorCollect(data: CollectorData, interaction: APIInteraction) {
 *   // do something...
 * }
 * // IMPORTANT: to make the collect event work you have to include your collector id in every custom_id of your components. put the id at the end of your custom_id separated by dot(.)
 * // e.g.
 * reply({
 *   content: "Hello",
 *   components: [
 *     {
 *       type: 1,
 *       components: [
 *         {
 *           type: 2,
 *           custom_id: "button_id." + collId,
 *         }
 *       ]
 *     }
 *   ]
 * });
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

	await collector_subscriber.PSUBSCRIBE("*expired", async (message: string, channel: string) => {
		if (message.startsWith("clrs0"))
		{
			logger.info(`[Collector] ${message} expired.`)
			const get_expired_collector = await redis.GET(message.replace("clrs0", "clr0"));
			if (get_expired_collector) _end(JSON.parse(get_expired_collector) as CollectorData);
		}
	});
}

async function _end(data: CollectorData): Promise<void>
{
	try {
		const pwd = path.resolve(data.pwd, data.filename);
		const FiletoExec = await import(pwd);
		
		if (FiletoExec && FiletoExec._collectorEnd)
		{
			const getlatestData = await redis.GET("clr0" + data.id);
			if (!getlatestData) return;

			var latestData = JSON.parse(getlatestData) as CollectorData;
			if (!latestData?.collected)
			{
				Object.defineProperty(latestData, "collected", {
					value: [],
					enumerable: true
				});
			}
			
			if (!latestData?.message && latestData?.collected && latestData.collected.length >= 1)
			{
				const message_from_interaction = (latestData?.collected as APIInteraction[])[0]?.message as APIMessage;
				
				Object.defineProperty(latestData, "message", {
					value: message_from_interaction,
					enumerable: true
				});
			}
			
			logger.info(`[Collector] ${data.id} ended.`);
			FiletoExec._collectorEnd(latestData);
		}
	} catch (error: unknown) {
		
	}
}

export async function createCollector(data: CollectorData): Promise<void>
{
	if (!data.component_types) data.component_types = [...Object.values(ComponentType)].filter((val: string | ComponentType) => !isNaN(Number(val))) as number[];
	logger.info(`[Collector] ${data.id} created.`);
	redis.PSETEX("clrs0" + data.id, Number(data.time), "0");
	redis.PSETEX("clr0" + data.id, Number(Number(data.time) + 10000), JSON.stringify(data));
}

export async function collected(data: CollectorData, interaction: APIInteraction): Promise<void>
{
	const currentTTL = await redis.PTTL("clr0" + data.id);
	const currentData = await redis.GET("clr0" + data.id);
	
	if (currentData)
	{
		const newData: CollectorData = JSON.parse(currentData);
		
		if (newData.collected && Array.isArray(newData?.collected)) newData?.collected.push(interaction);
		else Object.defineProperty(newData, "collected", {
			value: [interaction],
			enumerable: true
		});

		if (data.expand_on_click) redis.PSETEX("clrs0" + data.id, Number(data.time), "0");
		redis.PSETEX("clr0" + newData.id, data.expand_on_click? Number(data.time) + 10000: currentTTL, JSON.stringify(newData));
	}
}

export async function setMessage(state: string, message: APIMessage): Promise<void>
{
	const currentData = await redis.GET(state);

	if (currentData)
	{
		logger.info(`[Collector] ${state} message set.`)

		const newData = JSON.parse(currentData);
		
		Object.defineProperty(newData, "message", {
			value: message,
			enumerable: true
		});

		redis.PSETEX(state, Number(newData.time), JSON.stringify(newData));
	}
}