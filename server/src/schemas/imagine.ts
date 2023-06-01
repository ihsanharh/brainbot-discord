import { Schema, model } from 'mongoose';

export interface Imagine {
	_id: string;
	lastImaginationTime: string;
	imagination?: string[];
}

export default model("c_imagine", new Schema<Imagine>({
	_id: { type: String, required: true },
	lastImaginationTime: { type: String, required: true },
	imagination: { type: Array, default: [] }
}));