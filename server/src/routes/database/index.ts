import { Request, Response, Router, json } from 'express';

import { HttpStatusCode } from "../../typings";
import ChatSchema, { Chat } from "../../schemas/chat";
import { verifyPrivateRouting } from "../../utils/middleware";

const DatabaseRoute: Router = Router();

DatabaseRoute.use(json());

/*
 * GET specific guild record from database
 */
DatabaseRoute.get("/guild/:id", verifyPrivateRouting, async (req: Request, res: Response) => {
	const { id } = req.params;
	const FindIt = await ChatSchema.findOne({ _id: id });
	
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

DatabaseRoute.post("/guild/:id", async (req: Request, res: Response) => {
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