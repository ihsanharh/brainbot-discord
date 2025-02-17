import "./services/redis";

import * as express from 'express';
import * as mongoose from 'mongoose';
import helmet from 'helmet';

import { Express, Response, Request } from 'express';
import { HttpStatusCode } from "./types/http";
import { OwnResponsePayloadType } from "./typings";

import { asOwnResponse } from "./services/own";
import { DatabaseUrl, ServerPort } from "./utils/config";
import logger from "./services/logger";
import routes from "./routes";

const App: Express = express();
mongoose.set('strictQuery', true);
mongoose.connect(DatabaseUrl)
.then(() => logger.info("Connected to database"))
.catch(() => logger.error("Failed to connect to database"));

App.disable("x-powered-by"); // disable x-powered-by for security
App.use(helmet());

App.use("/", routes);
/*
 * Custom 404 and 500 handler
 */
App.use(async (req: Request, res: Response) => {
	var statusCode = HttpStatusCode.NOT_FOUND
	
	return res.status(statusCode).json(
		asOwnResponse([`${statusCode}`], OwnResponsePayloadType.REQUEST, "Common.NotFound")
	);
});

App.use(async (err: unknown, req: Request, res: Response) => {
	var statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
	
	return res.status(statusCode).json(
		asOwnResponse([`${statusCode}`], OwnResponsePayloadType.REQUEST, "Common.InternalServerError")
	);
});

App.listen(ServerPort, async () => {
	logger.info(`Listening on Port :${ServerPort}`);
});