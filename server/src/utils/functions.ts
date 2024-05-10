import {

	APITextChannel,
	APINewsChannel,
	APIGuildVoiceChannel,
	APIGuildStageVoiceChannel,
	APIGuildCategoryChannel,
	APIThreadChannel,
	APIGuildForumChannel,
	APIChannel,
	APIGuildMember,
	APIRole,
	APIUser,
	ImageFormat,
	RouteBases,
	Routes
} from 'discord-api-types/v10';

import { res } from "./res";
import { DiscordAppId } from "./config";

export function abtob64(buffer: ArrayBuffer): string
{
	var binary = '';
	var bytes = new Uint8Array(buffer);
	var len = bytes.byteLength;
	for (var i = 0; i < len; i++)
	{
		binary += String.fromCharCode(bytes[i]);
	}
	
	return btoa(binary);
}
// https://stackoverflow.com/a/38858127 both up and down
export function b64toab(base64: string): ArrayBuffer
{
	var binary_string = atob(base64);
	var len = binary_string.length;
	var bytes = new Uint8Array(len);
	for (var i = 0; i < len; i++)
	{
		bytes[i] = binary_string.charCodeAt(i);
	}
	
	return bytes.buffer;
}

export function colourInt(code: string): number
{
	if (code === 'RANDOM') return Math.floor(Math.random() * (0xffffff + 1));
	if (code === 'DEFAULT') return 0;
	
	return parseInt(code.replace('#', ''), 16);
}

export function formatOwnResponse(str: string, args: string[]): string
{
	var res = str;
	
	for (let i = 0; i < args.length; i++)
	{
		res = res.replace(`@${i}`, args[i]);
	}
	
	return res;
}

export async function getDiscordChannel(id: string): Promise<APIChannel|null>
{
	try
	{
		return await res.get(Routes.channel(id)) as APIChannel;
	}
	catch(err: unknown)
	{
		console.error(err);
		return null
	}
}

export async function getDiscordUser(id?: string): Promise<APIUser|null>
{
	try
	{
		if (!id) id = DiscordAppId;
		
		return await res.get(Routes.user(id)) as APIUser;
	}
	catch
	{
		return null;
	}
}

type getGuildChannelsReturnType = APITextChannel[]|APINewsChannel[]|APIGuildVoiceChannel[]|APIGuildStageVoiceChannel[]|APIGuildCategoryChannel[]|APIThreadChannel[]|APIGuildForumChannel[];
export async function getGuildChannels(guild_id: string): Promise<getGuildChannelsReturnType|null>
{
	try
	{
		return await res.get(Routes.guildChannels(guild_id)) as getGuildChannelsReturnType;
	}
	catch
	{
		return null;
	}
}

export async function getGuildMember(guild_id: string, user_id: string): Promise<APIGuildMember | null>
{
	try
	{
		return await res.get(Routes.guildMember(guild_id, user_id)) as APIGuildMember;
	}
	catch
	{
		return null;
	}
}

export async function getGuildRoles(guild_id: string): Promise<APIRole[] | null>
{
	try
	{
		return await res.get(Routes.guildRoles(guild_id)) as APIRole[];
	}
	catch(err: unknown)
	{
		console.error(err)
		return null;
	}
}

export function makeAvatarUrl(user: APIUser, size: string = "1024"): string
{
	let format = ImageFormat.PNG;
	let modulo = Number(user?.discriminator) % 5;
	let endpoint = `/embed/avatars/${modulo}`;
	if (user?.avatar)
	{
		endpoint = `/avatars/${user?.id}/${user?.avatar}`;
		format = (user?.avatar.startsWith("a_")) ? ImageFormat.GIF : ImageFormat.WebP
	}
	
	return `${RouteBases.cdn}${endpoint}.${format}?size=${size}`;
}

export function makeId(length: number): string
{
	var result = '';
	var characters: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	
	for (var i = 0; i < length; i++)
	{
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	
	return result;
}