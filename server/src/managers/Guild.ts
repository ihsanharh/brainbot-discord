import { APIGuild, Routes } from "../typings";
import { res } from "../utils/res";
import { DiscordAppId } from "../utils/config";

export const GuildsCache: Map<string, APIGuild> = new Map<string, APIGuild>();

export async function _add(guild: APIGuild): Promise<void>
{
	GuildsCache.set(guild.id, guild);
}

export async function _delete(guild_id: string): Promise<void>
{
	GuildsCache.delete(guild_id);
}

export async function getGuilds(): Promise<APIGuild[]|null>
{
	try
	{
		if (GuildsCache.size >= 1)
		{
			return Array.from(GuildsCache.values()) as APIGuild[];
		}
		else
		{
			const guilds = await res.get(Routes.userGuilds()) as APIGuild[];
			guilds.forEach((guild: APIGuild) => GuildsCache.set(guild.id, guild));
			
			return guilds;
		}
	}
	catch
	{
		return null;
	}
}