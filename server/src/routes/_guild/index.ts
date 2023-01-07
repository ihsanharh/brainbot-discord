import { Request, Response, Router, json } from 'express';

import { APIGuild, HttpStatusCode } from "../../typings";
import { verifyPrivateRouting } from "../../utils/middleware";
import { _add, _delete, getGuilds } from "../../managers/Guild";

const GuildRoute: Router = Router();

GuildRoute.use(json({ limit: "100mb" }));

GuildRoute.get("/count", async (req: Request, res: Response) => {
	const guilds: APIGuild[] = await getGuilds() as APIGuild[];
	
	return res.status(HttpStatusCode.OK).json({
		"count": `${guilds.length}`
	});
});

GuildRoute.post("/create", verifyPrivateRouting, async (req: Request, res: Response) => {
	_add(req.body as APIGuild);
	return res.status(HttpStatusCode.OK).end();
});

GuildRoute.delete("/remove", verifyPrivateRouting, async (req: Request, res: Response) => {
	_delete(req.body.id);
	return res.status(HttpStatusCode.OK).end();
})

export { GuildRoute };