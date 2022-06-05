require('dotenv').config({
    path: __dirname.substring(0, __dirname.lastIndexOf("/")) + "/.env"
});

import { Client } from "./base/Client";

import { connectToDatabase } from "./database";

connectToDatabase();
new Client().launch();
