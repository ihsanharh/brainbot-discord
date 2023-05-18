import { NextFunction, Request, Response } from 'express';

import { OwnResponsePayloadType } from "../../typings";
import { Rsa } from "../../utils/config";
import { formatOwnResponse } from "../../utils/functions";
import { HttpStatusCode } from "../../utils/types/http";
import * as OwnResponse from "../../constants/OwnResponse";

export async function ApiAuth(req: Request, res: Response, next: NextFunction): Promise<Response|void>
{
	const { authorization } = req.headers;
	var statusCode = HttpStatusCode.UNAUTHORIZED;
	var m = formatOwnResponse(OwnResponse.Common.Unauthorized, [`${statusCode}`]);
	
	if (!authorization || authorization && authorization !== Rsa)
	{
		return res.status(HttpStatusCode.UNAUTHORIZED).json({
			m,
			t: OwnResponsePayloadType.AUTHENTICATION
		});
	}
	else
	{
		next();
	}
}