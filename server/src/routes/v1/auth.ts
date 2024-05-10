import { NextFunction, Request, Response } from 'express';

import { HttpStatusCode } from "../../types/http";
import { OwnResponsePayloadType } from "../../typings";

import { asOwnResponse } from "../../services/own";
import { Rsa } from "../../utils/config";


export async function ApiAuth(req: Request, res: Response, next: NextFunction): Promise<Response|void>
{
	const { authorization } = req.headers;
	var statusCode = HttpStatusCode.UNAUTHORIZED;
	
	if (!authorization || authorization && authorization !== Rsa)
	{
		return res.status(statusCode).json(
			asOwnResponse([`${statusCode}`], OwnResponsePayloadType.AUTHENTICATION, "Common.Unauthorized")
		);
	}
	else
	{
		next();
	}
}