require('dotenv').config({
    path: __dirname.substring(0, __dirname.lastIndexOf("/")) + "/.env"
});
require("./utils/error");

import { Client } from "./base/Client";
import { connectToDatabase } from "./database";

connectToDatabase();
new Client().launch();
