require('dotenv').config({
	path: __dirname.substring(0, __dirname.lastIndexOf("/")) + "/.env"
});
require("./utils/error");

import BrainBot from "./base/Client";
import { connectToDatabase } from "./database";

connectToDatabase();
(new BrainBot()).launch();
