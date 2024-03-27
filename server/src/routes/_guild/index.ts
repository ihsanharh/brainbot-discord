import { Request, Response, Router, json } from 'express';

import { HttpStatusCode } from "../../typings";
import { verifyPrivateRouting } from "../../utils/middleware";
import { _add, _delete } from "../../managers/Guild";
import { getGuildChannels, getGuildMember, getGuildMemberPermissionsForChannel } from "../../utils/functions";
import { compute_permission } from "../../utils/permissions";
import redis from "../../services/redis";

const GuildRoute: Router = Router();

GuildRoute.use(json());

GuildRoute.get("/count", async (req: Request, res: Response) => {
	let guild_count = 0;

	for await (const shard of redis.scanIterator({
		TYPE: "string",
		MATCH: "shard_*:guild_count",
		COUNT: 100
	}))
	{
		const get_guild_count: string|null = await redis.get(shard);
		if (get_guild_count) guild_count += Number(get_guild_count);
	}

	return res.status(HttpStatusCode.OK).json({
		count: guild_count
	});
});

GuildRoute.get("/:guild_id/channels", verifyPrivateRouting, async (req: Request, res: Response) => {
	const { guild_id } = req.params;
	const { permissionsfor } = req.query;
	
	if (!guild_id) return res.status(HttpStatusCode.BAD_REQUEST).json({ "message": `${HttpStatusCode.BAD_REQUEST} Invalid request` });
	
	const channel_list = await getGuildChannels(guild_id);
	if (!channel_list) return res.status(HttpStatusCode.NOT_FOUND).json({ "message": `${HttpStatusCode.NOT_FOUND} No channels found for this guild.` });
	
	if (permissionsfor)
	{
		const asGuildMember = await getGuildMember(guild_id, permissionsfor as string);
		
		if (asGuildMember)
		{
			for (let i = 0; i < channel_list.length; i++)
			{
				const perms = await compute_permission(asGuildMember, channel_list[i]);
				
				Object.defineProperty(channel_list[i], "own_permissions", {
					enumerable: true,
					value: perms
				});
			}
		}
	}
	
	return res.status(HttpStatusCode.OK).json(JSON.parse(JSON.stringify(channel_list)));
});

export { GuildRoute };