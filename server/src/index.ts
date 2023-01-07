require('dotenv').config({
	path: __dirname.substring(0, (__dirname.substring(0, __dirname.lastIndexOf("/"))).lastIndexOf("/")) + "/.env"
});

import * as express from 'express';
import * as mongoose from 'mongoose';

import routes from "./routes";
import { DatabaseUrl, ServerPort } from "./utils/config";
import { Express, Response, Request, NextFunction } from 'express';

const App: Express = express();
mongoose.set('strictQuery', true);
mongoose.connect(DatabaseUrl).then(() => console.log("connected to database"));

App.use("/", routes);

App.listen(ServerPort, () => {
	console.log(`Server is live at http://localhost:${ServerPort}`);
});