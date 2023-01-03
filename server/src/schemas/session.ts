import { Schema, model } from 'mongoose';

import { APIMessage } from "../typings";

export interface Session {
	_id: string;
	user: string;
	agent: string;
	last_message: APIMessage,
	messages?: APIMessage[];
}

export default model("chat", new Schema<Session>({
	user: { type: String, required: true },
	agent: { type: String, required: true },
	last_message: { type: Schema.Types.Mixed, default: {} },
	messages: { type: Array, default: [] }
}));