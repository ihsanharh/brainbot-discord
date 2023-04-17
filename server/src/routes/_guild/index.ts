import { Request, Response, Router, json } from 'express';

import { APIGuild, GuildCD, HttpStatusCode } from "../../typings";
import { verifyPrivateRouting } from "../../utils/middleware";
import { _add, _delete, getGuilds } from "../../managers/Guild";
import { getGuildChannels, getGuildMember, getGuildMemberPermissionsForChannel } from "../../utils/functions";

const GuildRoute: Router = Router();

GuildRoute.use(json({ limit: "100mb" }));

GuildRoute.get("/count", async (req: Request, res: Response) => {
	const guilds: APIGuild[] = await getGuilds() as APIGuild[];
	
	return res.status(HttpStatusCode.OK).json({
		"count": `${guilds.length}`
	});
});

GuildRoute.post("/create", verifyPrivateRouting, async (req: Request, res: Response) => {
	const created: GuildCD = JSON.parse(JSON.stringify(req.body));
	_add(created);
	return res.status(HttpStatusCode.OK).end();
});

GuildRoute.delete("/delete", verifyPrivateRouting, async (req: Request, res: Response) => {
	const deleted: GuildCD = JSON.parse(JSON.stringify(req.body));
	_delete(deleted);
	return res.status(HttpStatusCode.OK).end();
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
				const perms = await getGuildMemberPermissionsForChannel(asGuildMember, channel_list[i]);
				
				Object.defineProperty(channel_list[i], "req_user_permissions", {
					enumerable: true,
					value: {
						"allow": String(perms.allow),
						"deny": String(perms.deny)
					}
				});
			}
		}
	}
	
	return res.status(HttpStatusCode.OK).json(JSON.parse(JSON.stringify(channel_list)));
});

export { GuildRoute };