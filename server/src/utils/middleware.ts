import { NextFunction, Request, Response } from 'express';

import { HttpStatusCode } from "../types/http";
import { Rsa } from "./config";

/*
 * used to protect private route and check every request headers for authorization, such as database route, etc
 */
export function verifyPrivateRouting(req: Request, res: Response, next: NextFunction)
{
	const { authorization } = req.headers;
	
	if (!authorization || authorization !== Rsa)
	{
		return res.status(HttpStatusCode.UNAUTHORIZED).json({ "message": `${HttpStatusCode.UNAUTHORIZED}: Unathorized.` });
	}
	else
	{
		return next();
	}
};

export function validateOwner(req: Request, res: Response, next: NextFunction)
{
	const { auth } = req.query;
	
	if (!auth || auth !== Rsa)
	{
		return res.status(HttpStatusCode.UNAUTHORIZED).json({ "message": `${HttpStatusCode.UNAUTHORIZED}: Unathorized.` });
	}
	else
	{
		return next();
	}
}