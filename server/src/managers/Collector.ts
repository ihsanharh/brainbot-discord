import * as path from 'node:path';

import { APIInteraction, APIMessage, CollectorData } from "../typings";

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
		
		_collect(data, interaction);
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