require('dotenv').config({
	path: __dirname.substring(0, (__dirname.substring(0, __dirname.lastIndexOf("/"))).lastIndexOf("/")) + "/.env"
});
require('sharp');

import { Express, Response, Request, NextFunction } from 'express';
import * as express from 'express';
import * as mongoose from 'mongoose';
import helmet from 'helmet';

import { OwnResponsePayloadType } from "./typings";
import { DatabaseUrl, ServerPort } from "./utils/config";
import { formatOwnResponse } from "./utils/functions";
import { HttpStatusCode } from "./utils/types/http";
import * as OwnResponse from "./constants/OwnResponse";
import routes from "./routes";

const App: Express = express();
mongoose.set('strictQuery', true);
mongoose.connect(DatabaseUrl).then(() => console.log("connected to database"));

App.disable("x-powered-by"); // disable x-powered-by for security
App.use(helmet());

App.use("/", routes);

/*
 * Custom 404 and 500 handler
 */
App.use(async (req: Request, res: Response) => {
	var statusCode = HttpStatusCode.NOT_FOUND;
	
	return res.status(statusCode).json({
		m: formatOwnResponse(OwnResponse.Common.NotFound, [`${statusCode}`]),
		t: OwnResponsePayloadType.REQUEST
	});
});

App.use(async (err, req: Request, res: Response) => {
	var statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
	
	return res.status(statusCode).json({
		m: formatOwnResponse(OwnResponse.Common.InternalServerError, [`${statusCode}`]),
		t: OwnResponsePayloadType.REQUEST
	});
});

App.listen(ServerPort, () => {
	console.log(process.env)
	console.log(`Server is live at http://localhost:${ServerPort}`);
});