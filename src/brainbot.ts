import { Client } from "./base/Client";
import { connectToDatabase } from "./database";

connectToDatabase();
new Client().launch();
