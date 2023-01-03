import { Schema, model } from 'mongoose';

export interface Chat {
	_id: string;
	count: number;
	channel: string | null;
	languages?: string[];
}

export default model("chat", new Schema<Chat>({
	_id: { type: String, required: true },
	count: { type: Number, default: 0 },
	channel: { type: String, default: null },
	languages: { type: Array, default: [] }
}));