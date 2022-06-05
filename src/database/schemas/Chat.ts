import { Schema, model } from 'mongoose';

interface Chat {
	_id: string;
	count: number;
	channel: string | null;
	prefix?: string;
	languages?: any;
}

export default model(
	"chat",
	new Schema<Chat>({
		_id: {
			type: String,
			required: true
		},
		count: {
			type: Number,
			default: 0
		},
		channel: {
			type: String,
			default: null
		},
		prefix: {
			type: String,
			default: "--"
		},
		languages: {
			type: Array,
			default: []
		}
	})
);
