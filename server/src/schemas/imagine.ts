import { Schema, model } from 'mongoose';

export interface Imagine {
	_id: string;
	imagination: string[];
	lastImaginationTime: string;
}

export default model("cooldown", new Schema<Imagine>({
	_id: { type: String, required: true },
	imagination: { type: Array, required: true },
	lastImaginationTime: { type: String, required: true },
}));