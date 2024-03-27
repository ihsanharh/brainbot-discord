import { fetch } from 'undici';

import { ServerUrl, Rsa } from "../utils/config";
import { OwnResponsePayload } from "../typings";

/**
 * @description - Helpers for external thread for accessing redis.
 * all methods below are for external thread.
 * Usable on main thread, but it is preferred to import redis object directly in main thread
 *
 * @example
 * import Cache from "managers/Cache.ts";
 *
 * const id: string = "hey";
 * Cache.find(id); //get cache value
 * Cache.set(id); //caches id variable
 * Cache.remove(id); //removes id variable from cache
 */

/**
	* find key and return its value
	* @param {string} k - key to get
	* @return {Promise<string|null>} return a promise containing string if found, otherwise a null
	*/
export async function find(k: string): Promise<string|null>
{
	const res = await fetch(`${ServerUrl}/v1/cache/${k}`, {
		method: "GET"
	});
	
	return (res.ok? (await res.json() as OwnResponsePayload)?.d as string: null);
}

/**
	* check wether the key exist or not. it's basically a wrapper of find, use find instead.
	* @param {string} k - key to check
	* @return {boolean} indicating key exist or not
	*/
export async function has(k: string): Promise<boolean>
{
	const exist = await find(k);
	
	return exist? true : false;
}

/**
	* set key-value pair cache.
	* @param {string} k - key of the cache. must be unique, if there's already one cached, it will be replaced by this one. be careful
	* @param {string} [value=0] - value of the key, if not provided will set to "0"
	* @param {number} [ttl] - time to live for the key-value.
	* @return {boolean} return true on cached, otherwise false
	*/
export async function set(k: string, v: string = "0", ttl?: number): Promise<boolean>
{
	const res = await fetch(`${ServerUrl}/v1/cache/${k}/${encodeURIComponent(v)}`, {
		method: "POST",
		body: JSON.stringify({
			ttl
		})
	});
	
	return (res.ok? true: false);
}

/**
	* delete key. it does not check for the key
	* @param {string} k - key to deleted
	* @return {boolean} will always return true
	*/
export async function remove(k: string): Promise<boolean>
{
	fetch(`${ServerUrl}/v1/cache/${k}`, {
		method: "DELETE"
	});
	
	return true;
}