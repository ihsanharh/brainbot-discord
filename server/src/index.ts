require('dotenv').config({
	path: __dirname.substring(0, (__dirname.substring(0, __dirname.lastIndexOf("/"))).lastIndexOf("/")) + "/.env"
});
require('sharp');
require("./error");
require("./services/redis");

import { Express, Response, Request, NextFunction } from 'express';
import * as express from 'express';
import * as mongoose from 'mongoose';
import helmet from 'helmet';

import { OwnResponsePayloadType } from "./typings";
import { asOwnResponse } from "./services/own";
import { DatabaseUrl, ServerPort } from "./utils/config";
import { HttpStatusCode } from "./utils/types/http";
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
	
	return res.status(statusCode).json(
		asOwnResponse([`${statusCode}`], OwnResponsePayloadType.REQUEST, "Common.NotFound")
	);
});

App.use(async (err, req: Request, res: Response) => {
	var statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
	
	return res.status(statusCode).json(
		asOwnResponse([`${statusCode}`], OwnResponsePayloadType.REQUEST, "Common.InternalServerError")
	);
});

App.listen(ServerPort, () => {
	console.log(process.env)
	console.log(`Server is live at http://localhost:${ServerPort}`);
});