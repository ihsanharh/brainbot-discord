import {
	APIApplicationCommand,
	APITextChannel,
	APINewsChannel,
	APIGuildVoiceChannel,
	APIGuildStageVoiceChannel,
	APIGuildCategoryChannel,
	APIThreadChannel,
	APIGuildForumChannel,
	APIChannel,
	APIGuild,
	APIGuildMember,
	APIRole,
	APIUser,
	APIOverwrite,
	CGuildChannelType,
	ImageFormat,
	RouteBases,
	Routes
} from "../typings";
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

export async function getGuildMemberPermissionsForChannel(member: APIGuildMember, channel: CGuildChannelType): Promise<{allow: bigint;deny: bigint;}>
{
	let allowed_b: string[] = ["0"];
	let denied_b: string[] = ["0"];
	const permissions_overwrites: APIOverwrite[] = channel?.permission_overwrites as APIOverwrite[];
	const guild_roles = await getGuildRoles(channel.guild_id as string);
	
	guild_roles?.forEach((role: APIRole) => {
		if (role.id === channel.guild_id as string) allowed_b.push(role.permissions);
		if (member.roles.length >= 1 && member?.roles?.includes(role.id)) allowed_b.push(role.permissions);
	});
	
	if (member?.user) {
		if (permissions_overwrites.length < 1) return {
			allow: BigInt(allowed_b.reduce((i: string, j: string) => String(BigInt(i) | BigInt(j)))),
			deny: BigInt(denied_b[0])
		}
		
		const permissions_overwrites_ids: string[] = permissions_overwrites.map((overwrite: APIOverwrite) => overwrite?.id);
		
		if (permissions_overwrites_ids.includes(member?.user?.id))
		{
			var permissions_overwrites_this_member = permissions_overwrites.filter((overwrite: APIOverwrite) => overwrite.id === member?.user?.id)[0];
			
			if (permissions_overwrites_this_member?.allow) allowed_b.push(permissions_overwrites_this_member.allow);
			if (permissions_overwrites_this_member?.deny) allowed_b.push(permissions_overwrites_this_member.deny);
		}
		
		if (member?.roles && member?.roles.length >= 1)
		{
			for (let i = 0; i < member?.roles.length; ++i)
			{
				if (permissions_overwrites_ids.includes(member?.roles[i]))
				{
					const permissions_overwrites_this_role = permissions_overwrites.filter((overwrite: APIOverwrite) => overwrite.id === member.roles[i])[0];
					
					if (permissions_overwrites_this_role?.allow) allowed_b.push(permissions_overwrites_this_role.allow);
					if (permissions_overwrites_this_role?.deny) denied_b.push(permissions_overwrites_this_role.deny);
				}
			}
		}
		
		let allow = BigInt(allowed_b.reduce((i: string, j: string) => String(BigInt(i) | BigInt(j)))),
		deny = BigInt(denied_b.reduce((i: string, j: string) => String(BigInt(i) | BigInt(j))))
		
		if ((allow & deny) == deny) allow = allow & ~deny;
		
		return {allow, deny}
	}
	else
	{
		return {allow:0n,deny:0n}
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