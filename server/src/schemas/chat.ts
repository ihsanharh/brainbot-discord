import { Schema, model } from 'mongoose';

export interface Chat {
	_id: string;
	count: number;
	channel: string;
	version: string;
	tweaks: {
		sensible_wacky: number;
		shy_talkative: number;
		selfcentred_attentive: number;
	};
	languages?: string[];
}

export default model("chat", new Schema<Chat>({
	_id: { type: String, required: true },
	count: { type: Number, default: 0 },
	channel: { type: String, default: "" },
	version: { type: String, default: "v1" },
	tweaks: {
		sensible_wacky: { type: Number, default: 50 },
		shy_talkative: { type: Number, default: 50 },
		selfcentred_attentive: { type: Number, default: 50 }
	},
	languages: { type: Array, default: [] }
}));