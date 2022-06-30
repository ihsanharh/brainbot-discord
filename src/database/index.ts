import { connect, connection } from 'mongoose';

import { DatabaseSearch } from "../utils/interfaces";
import Blacklist from "./schemas/Blacklist";
import Bot from "./schemas/Bot";
import Chat from "./schemas/Chat";
import Proxys from "./schemas/Proxy";
import Session from "./schemas/Session";

export function connectToDatabase() {
	const DB_URI = process.env.NODE_ENV === "production" ? process.env.PROD_DATABASE_URI : process.env.DEV_DATABASE_URI
	
	return connect(DB_URI)
}

export function disconnectFromDatabase() {
	return connection.close();
}

export {
	Blacklist,
	Bot,
	Chat,
	Proxys,
	Session
}

export default async (options: DatabaseSearch) => {
	interface collectionsIn {
		[key: string]: any;
	}
	
	const collections: collectionsIn = {
		blacklist: Blacklist,
		bot: Bot,
		chat: Chat,
		proxy: Proxys,
		session: Session
	}
	
	const collection = collections[options.collection as keyof collectionsIn];
	const query = options.query;
	const values = options.values;
	
	switch (options.method) {
		case "find":
			if (options.unlimited) return await collection.find(query);
			
			return await collection.findOne(query);
			break;
		case "update":
			if (!options.values) throw "New values need to be provided for database update";
			
			return await collection.updateOne(query, values);
			break;
		case "create":
			return await new collection(values).save();
			break;
		case "delete":
			if (options.unlimited) return await collection.deleteMany(query);
			
			return await collection.deleteOne(query);
		default:
			throw "The given method is not implemented yet.";
	}
}
