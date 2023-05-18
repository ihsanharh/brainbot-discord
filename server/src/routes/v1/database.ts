import { Request, Response, Router, json } from 'express';

import { formatOwnResponse, makeId } from "../../utils/functions";
import { HttpStatusCode } from "../../utils/types/http";
import { OwnResponsePayloadType } from "../../typings";
import BlacklistSchema, { Blacklist } from "../../schemas/blacklist";
import ChatSchema, { Chat } from "../../schemas/chat";
import * as OwnResponse from "../../constants/OwnResponse";

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

const DatabaseRoute: Router = Router();

DatabaseRoute.use(json());

/* catch all request */
DatabaseRoute.all("/:collection/:id?", async (req: Request, res: Response) => {
	var { collection, id } = req.params;
	var { many } = req.query;
	var statusCode = HttpStatusCode.OK, result, d, m;
	
	if (!Collections[collection])
	{
		statusCode = HttpStatusCode.NOT_FOUND;
		m = formatOwnResponse(OwnResponse.Common.DoesNotExist, [`${statusCode}`, collection]);
	}
	else if (id && String(id).length < 12 || req.body && req.body?._id && String(req.body?._id).length < 12)
	{
		statusCode = HttpStatusCode.LENGTH_REQUIRED;
		m = formatOwnResponse(OwnResponse.Common.QueryParamsLength, [`${statusCode}`, "id", "12 characters"]);
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
					m = formatOwnResponse(OwnResponse.Common.Found, [`${statusCode}`]);
				}
				else
				{
					statusCode = HttpStatusCode.NOT_FOUND;
					m = formatOwnResponse(OwnResponse.Common.NotFound, [`${statusCode}`]);
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
					m = formatOwnResponse(OwnResponse.Database.RecordCreated, [`${statusCode}`]);
				}
				else
				{
					statusCode = HttpStatusCode.CONFLICT;
					m = isExisting? formatOwnResponse(OwnResponse.Database.AlreadyExist, [`${statusCode}`]): formatOwnResponse(OwnResponse.Common.NotFound, [`${statusCode}`]);
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
					m = formatOwnResponse(OwnResponse.Database.RecordUpdated, [`${statusCode}`]);
				}
				else
				{
					statusCode = HttpStatusCode.NOT_FOUND;
					m = formatOwnResponse(OwnResponse.Common.NotFound, [`${statusCode}`]);
				}
				
				break;
			case "DELETE":
				result = await Collection.findOneAndDelete({ _id: id });
				
				if (result)
				{
					statusCode = HttpStatusCode.ACCEPTED;
					m = formatOwnResponse(OwnResponse.Database.RecordDeleted, [`${statusCode}`]);
				}
				else
				{
					statusCode = HttpStatusCode.NOT_FOUND;
					m = formatOwnResponse(OwnResponse.Common.NotFound, [`${statusCode}`]);
				}
				
				break;
			default:
			  statusCode = HttpStatusCode.NOT_IMPLEMENTED;
			  m = formatOwnResponse(OwnResponse.Common.NotSupported, [`${statusCode}`, `${req.method}`]);
		}
	}
	
	if (result) d = JSON.parse(JSON.stringify(result));
	
	return res.status(statusCode).json({
		m,
		t: OwnResponsePayloadType.DATABASE_QUERY,
		d
	});
});

export default DatabaseRoute;