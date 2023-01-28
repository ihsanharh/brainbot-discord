import { APIGuild, GuildCD, Routes } from "../typings";
import { res } from "../utils/res";
import { DiscordAppId } from "../utils/config";

export const GuildsCache: Map<string, string> = new Map<string, string>();

export async function _add(guild: GuildCD): Promise<void>
{
	GuildsCache.set(guild.id, guild.guild as string);
}

export async function _delete(guild: GuildCD): Promise<void>
{
	GuildsCache.delete(guild.id);
}

export async function getGuilds(): Promise<APIGuild[]|null>
{
	try
	{
		if (GuildsCache.size >= 1)
		{
			return Array.from(GuildsCache.values()).map((str_guild: string) => JSON.parse(str_guild)) as APIGuild[];
		}
		else
		{
			const guilds = await res.get(Routes.userGuilds()) as APIGuild[];
			guilds.forEach((guild: APIGuild) => GuildsCache.set(guild.id, JSON.stringify(guild)));
			
			return guilds;
		}
	}
	catch
	{
		return null;
	}
}