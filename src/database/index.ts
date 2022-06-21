import { connect } from 'mongoose';

import { DatabaseSearch } from "../utils/interfaces";
import Blocked from "./schemas/Blocked";
import Chat from "./schemas/Chat";
import Proxys from "./schemas/Proxy";

export function connectToDatabase(): void {
	const DB_URI = process.env.NODE_ENV === "production" ? process.env.PROD_DATABASE_URI : process.env.DEV_DATABASE_URI
	
	connect(DB_URI).then(() => {
		console.log("Connected to the database.");
	}).catch((reason: any) => {
		console.error(reason);
	});
}

export {
	Blocked,
	Chat,
	Proxys
}

export default async (options: DatabaseSearch) => {
	interface collectionsIn {
		[key: string]: any;
	}
	
	const collections: collectionsIn = {
		blocked: Blocked,
		chat: Chat,
		proxy: Proxys
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
