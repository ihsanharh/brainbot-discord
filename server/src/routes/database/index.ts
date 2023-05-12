import { Request, Response, Router, json } from 'express';

import { HttpStatusCode } from "../../typings";
import BlacklistSchema, { Blacklist } from "../../schemas/blacklist";
import ChatSchema, { Chat } from "../../schemas/chat";
import { verifyPrivateRouting } from "../../utils/middleware";

const DatabaseRoute: Router = Router();

DatabaseRoute.use(json());

DatabaseRoute.get("/*", (req: Request, res: Response) => {
	console.log(req);
	return res.status(200).json({
		"anjing": "blok",
	});
});

/*
 * Blacklist route
 *
 */
DatabaseRoute.get("/blacklist/:id", verifyPrivateRouting, async (req: Request, res: Response) => {
	const GetBlacklists: Blacklist[]|null = await BlacklistSchema.findOne({ id: req.params['id'] });
	
	if (GetBlacklists)
	{
		const make_json = JSON.parse(JSON.stringify(GetBlacklists));
		
		return res.status(HttpStatusCode.OK).json(make_json);
	}
	else
	{
		return res.status(HttpStatusCode.NOT_FOUND).json({ "message": `${HttpStatusCode.NOT_FOUND}: no blacklist found.` });
	}
});

DatabaseRoute.post("/blacklist", verifyPrivateRouting, async (req: Request, res: Response) => {
	const req_blacklist: Blacklist = req.body;
	let GetBlacklist: Blacklist|null = await BlacklistSchema.findOne({ id: req_blacklist["id"] });
	
	if (GetBlacklist)
	{
		return res.status(HttpStatusCode.NOT_MODIFIED).json({
			"message": `${HttpStatusCode.NOT_MODIFIED} already exist.`,
			"d": JSON.stringify(GetBlacklist)
		});
	}
	else
	{
		GetBlacklist = await new BlacklistSchema(req.body).save();
		const make_json = JSON.parse(JSON.stringify(GetBlacklist));
		
		return res.status(HttpStatusCode.CREATED).json(make_json);
	}
});

DatabaseRoute.delete("/blacklist/:t/:id", verifyPrivateRouting, async (req: Request, res: Response) => {
	const { t, id } = req.params;
	
	if (!t || !id) return res.status(HttpStatusCode.NOT_FOUND).json({ "message": `${HttpStatusCode.NOT_FOUND} invalid.` });
	
	const GetBlacklist: Blacklist|null = await BlacklistSchema.findOne({ id, type: String(t).toUpperCase() });
	
	if (GetBlacklist)
	{
		await BlacklistSchema.deleteOne({ _id: GetBlacklist["_id"] });
		
		return res.status(HttpStatusCode.GONE).json({ "message": `${HttpStatusCode.GONE} deleted.` });
	}
	else
	{
		return res.status(HttpStatusCode.NOT_FOUND).json({ "message": `${HttpStatusCode.NOT_FOUND}: not found.` });
	}
});

/*
 * GET specific guild record from database
 */
DatabaseRoute.get("/guild/:id", verifyPrivateRouting, async (req: Request, res: Response) => {
	const { id } = req.params;
	const FindIt: Chat | null = await ChatSchema.findOne({ _id: id });
	
	if (FindIt)
	{
		var make_json = JSON.parse(JSON.stringify(FindIt));
		
		return res.status(HttpStatusCode.OK).json(make_json);
	}
	else
	{
		return res.status(HttpStatusCode.NOT_FOUND).json({ "message": `${HttpStatusCode.NOT_FOUND}: guild not found.` });
	}
});

DatabaseRoute.patch("/guild/:id", verifyPrivateRouting, async (req: Request, res: Response) => {
	const { id } = req.params;
	const FindIt: Chat | null = await ChatSchema.findOne({ _id: id });
	
	if (FindIt)
	{
		await ChatSchema.updateOne({ _id: id }, req.body);
		
		return res.status(HttpStatusCode.OK).json({ "message": `${HttpStatusCode.OK}: resource updated.` });
	}
	else
	{
		return res.status(HttpStatusCode.NOT_FOUND).json({ "message": `${HttpStatusCode.NOT_FOUND}: guild not found.` });
	}
});

DatabaseRoute.post("/guild/:id", verifyPrivateRouting, async (req: Request, res: Response) => {
	const { id } = req.params;
	var FindIt: Chat | null = await ChatSchema.findOne({ _id: id });
	
	if (FindIt)
	{
		return res.status(HttpStatusCode.OK).json({ "message": `${HttpStatusCode.OK}: already exist.` });
	}
	else
	{
		FindIt = await new ChatSchema(req.body).save();
		const make_json = JSON.parse(JSON.stringify(FindIt));
		
		return res.status(HttpStatusCode.CREATED).json(make_json);
	}
});

export { DatabaseRoute };