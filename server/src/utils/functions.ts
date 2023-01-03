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
	ImageFormat,
	RouteBases,
	Routes
} from "../typings";
import { res } from "./res";
import { DiscordAppId } from "./config";

export function colourInt(code: string): number
{
	if (code === 'RANDOM') return Math.floor(Math.random() * (0xffffff + 1));
	if (code === 'DEFAULT') return 0;
	
	return parseInt(code.replace('#', ''), 16);
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

export async function getGuildChannels(guild_id: string): Promise<APIChannel[]|null>
{
	try
	{
		return await res.get(Routes.guildChannels(guild_id)) as APIChannel[];
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

export async function getGuildMemberPermissionsForChannel(member: APIGuildMember, channel: APITextChannel|APINewsChannel|APIGuildVoiceChannel|APIGuildStageVoiceChannel|APIGuildCategoryChannel|APIThreadChannel|APIGuildForumChannel): Promise<{allow: bigint;deny: bigint;}>
{
	let allowed_b: string[] = ["0"];
	let denied_b: string[] = ["0"];
	const permissions_overwrites: APIOverwrite[] = channel?.permission_overwrites as APIOverwrite[];
	
	if (member?.user) {
		if (permissions_overwrites.length < 1) return {allow:0n,deny:0n};
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
		
		return {
			allow: BigInt(allowed_b.reduce((p: string, c: string) => String(BigInt(p) | BigInt(c)))),
			deny: BigInt(denied_b.reduce((p: string, c: string) => String(BigInt(p) | BigInt(c))))
		}
	}
	else
	{
		return {allow:0n,deny:0n}
	}
}

export async function getGuildRole(guild_id: string, role_id: string): Promise<APIRole | null>
{
	try
	{
		return await res.get(Routes.guildRole(guild_id, role_id)) as APIRole;
	}
	catch
	{
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
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    
    return result;
}