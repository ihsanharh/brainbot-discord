import { Request, Response, Router, json } from 'express';

import { formatOwnResponse, makeId } from "../../utils/functions";
import { HttpStatusCode } from "../../utils/types/http";
import { OwnResponsePayload, OwnResponsePayloadType } from "../../typings";
import BlacklistSchema, { Blacklist } from "../../schemas/blacklist";
import ChatSchema, { Chat } from "../../schemas/chat";

const Collections: {[key: string]: any;} = {
	blacklist: BlacklistSchema,
	chat: ChatSchema
}

/* Route for /v1/database/{collection}/{id}?
 * if one wants to interact with the database,
 * they must do it through this route.
 * 
 * GET: get record
 * POST: create a new record
 * PATCH: update existing record
 * DELETE: remove record from database
 */

const responses = [
	/* @0 is recommended for status code. */
	
	/* 0 DEFAULT */ [
		"@0: @1 does not exist.",
		"@0: id query/params must be 12 bytes long or more."
	],
	/* 1 GET */ [
		"@0: nothing found.",
		"@0: found."
	],
	/* 2 POST */ [
		"@0: failed to create requested record.",
		"@0: record created.",
		"@0: already exist."
	],
	/* 3 PATCH */ [
		"@0: record updated."
	],
	/* 4 DELETE */ [
		"@0: record deleted."
	],
]

const DatabaseRoute: Router = Router();

DatabaseRoute.use(json());

/* catch all request */
DatabaseRoute.all("/:collection/:id?", async (req: Request, res: Response) => {
	var { collection, id } = req.params;
	var { many } = req.query;
	var statusCode = HttpStatusCode.OK, result, m;
	
	if (!Collections[collection])
	{
		statusCode = HttpStatusCode.NOT_FOUND;
		m = formatOwnResponse(responses[0][0], [`${statusCode}`, collection]);
	}
	else if (id && String(id).length < 12 || req.body && req.body?._id && String(req.body?._id).length < 12)
	{
		statusCode = HttpStatusCode.LENGTH_REQUIRED;
		m = formatOwnResponse(responses[0][1], [`${statusCode}`]);
	}
	else
	{
		var Collection = Collections[collection];
		
		switch (req.method) {
			case "GET":
				result = await Collection.findOne({ _id: id });
				if (many && many === "true") result = await Collection.find(id?{ _id: id }:{});
				
				if (result)
				{
					statusCode = HttpStatusCode.FOUND;
					m = formatOwnResponse(responses[1][1], [`${statusCode}`]);
				}
				else
				{
					statusCode = HttpStatusCode.NOT_FOUND;
					m = formatOwnResponse(responses[1][0], [`${statusCode}`]);
				}
				
				break;
			case "POST":
				let isExisting;
				let record = req.body;
				
				if (record?.id || record?._id) isExisting = await Collection.findOne(record?.id? {id: record?.id}: {_id: record?._id});
				else Object.defineProperty(record, "_id", {
					enumerable: true,
					value: makeId(32)
				});
				if (!isExisting) result = await new Collection(record).save();
				if (result)
				{
					statusCode = HttpStatusCode.CREATED;
					m = formatOwnResponse(responses[2][1], [`${statusCode}`]);
				}
				else
				{
					statusCode = HttpStatusCode.CONFLICT;
					m = isExisting? formatOwnResponse(responses[2][2], [`${statusCode}`]): formatOwnResponse(responses[2][0], [`${statusCode}`]);
					result = isExisting? isExisting: null;
				}
				
				break;
			case "PATCH":
				result = await Collection.findOneAndUpdate({ _id: id }, req.body, {
					returnDocument: "after"
				});
				
				if (result)
				{
					statusCode = HttpStatusCode.ACCEPTED;
					m = formatOwnResponse(responses[3][0], [`${statusCode}`]);
				}
				else
				{
					statusCode = HttpStatusCode.NOT_FOUND;
					m = formatOwnResponse(responses[1][0], [`${statusCode}`]);
				}
				
				break;
			case "DELETE":
				result = await Collection.findOneAndDelete({ _id: id });
				
				if (result)
				{
					statusCode = HttpStatusCode.ACCEPTED;
					m = formatOwnResponse(responses[4][0], [`${statusCode}`]);
				}
				else
				{
					statusCode = HttpStatusCode.CONFLICT;
					m = formatOwnResponse(responses[1][0], [`${statusCode}`]);
				}
				
				break;
			default:
			  statusCode = HttpStatusCode.NOT_IMPLEMENTED;
		}
	}
	
	return res.status(statusCode).json({
		m,
		t: OwnResponsePayloadType.DATABASE_QUERY,
		d: result? JSON.parse(JSON.stringify(result)): {},
	});
});

export default DatabaseRoute;