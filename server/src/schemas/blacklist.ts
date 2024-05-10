import { Schema, model } from 'mongoose';

export interface Blacklist {
	_id?: string;
	id: string;
	type: string;
}

export default model("blacklist", new Schema<Blacklist>({
	id: { type: String, required: true },
	type: { type: String, required: true },
}));