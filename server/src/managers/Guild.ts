import { APIGuild, GuildCD, Routes } from "../typings";
import { res } from "../utils/res";
import { DiscordAppId } from "../utils/config";

export const GuildsCache: Map<string, string> = new Map<string, string>();

export async function _add(guild: GuildCD): Promise<void>
{
	GuildsCache.set(guild.id, guild?.guild as string);
}

export async function _delete(guild: GuildCD): Promise<void>
{
	GuildsCache.delete(guild.id);
}

export async function getGuilds(): Promise<APIGuild[]|null>
{
	try
	{
		if (GuildsCache.size < 1)
		{
			let lastGuild;
			
			while (true)
			{
				const fetched = await res.get(Routes.userGuilds(), {
					query: lastGuild? new URLSearchParams(`after=${lastGuild?.id}`): undefined
				}) as APIGuild[];
				fetched.forEach((guild: APIGuild) => GuildsCache.set(guild.id, JSON.stringify(guild)));
				
				if (fetched.length >= 200) lastGuild = fetched[199];
				else break;
			}
		}
		
		return [...[...GuildsCache.values()].map((str_guild: string) => JSON.parse(str_guild) as APIGuild)]
	}
	catch(e: unknown)
	{
		console.error("guilds fetch error!!!!!!!!")
		console.error(e)
		return null;
	}
}