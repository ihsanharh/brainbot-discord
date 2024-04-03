import { Schema, model } from 'mongoose';

type where = "GUILD" | "DM";

export interface Session {
	_id: string;
	user_id: string;
	useragent: string;
	proxy_id: string;
	proxy: string;
	timestamp: string;
	where?: where;
	guild_id?: string;
	context?: string[];
}

export default model("session", new Schema<Session>({
	user_id: { type: String, required: true },
	useragent: { type: String, required: true },
	proxy_id: { type: String, required: true },
	proxy: { type: String, required: true },
	timestamp: { type: String, required: true },
	where: { type: String, default: "GUILD" },
	guild_id: { type: String, default: "0" },
	context: { type: Array, default: [] },
}));