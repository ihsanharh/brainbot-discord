/* internal cache */

import { fetch } from 'undici';

import { ServerUrl, Rsa } from "../utils/config";

export const Cache: Map<string, any> = new Map<string, any>();

export async function _set(k: string, v: any): Promise<void>
{
	Cache.set(k, v);
}

export async function _delete(k: string): Promise<void>
{
	Cache.delete(k);
}

/* all methods below are for external thread.
 * for main thread use above method instead, or just import the Cache variable directly.
 *
 * • example usage for external thread:
 * import * as Cache from "managers/Cache.ts";
 *
 * const id: string = "hey";
 * Cache.has(id); //check if cache has id variable
 * Cache.set(id); //caches id variable
 * Cache.remove(id); //removes id variable from cache
 */

export async function has(k: string): Promise<boolean>
{
	const res = await fetch(`${ServerUrl}/_cache?key=${k}`, {
		method: "GET"
	});
	
	if (res.ok) return true;
	else return false;
}

export async function set(k: string, v: string = "value"): Promise<boolean>
{
	const res = await fetch(`${ServerUrl}/_cache?key=${k}&value=${encodeURIComponent(v)}`, {
		method: "POST"
	});
	
	if (res.ok) return true;
	else return false;
}

export async function remove(k: string): Promise<boolean>
{
	const res = await fetch(`${ServerUrl}/_cache?key=${k}`, {
		method: "DELETE"
	});
	
	if (res.ok) return true;
	else return false;
}