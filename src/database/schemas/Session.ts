import { model, Schema } from 'mongoose';

export interface Session {
	userId: string;
	proxy: string;
	userAgent: string | number;
	context: any[];
}

export default model(
	"session",
	new Schema({
		userId: {
			type: String,
			required: true
		},
		proxyId: {
			type: String,
			required: true
		},
		proxy: {
			type: String,
			required: true
		},
		userAgent: {
			type: String,
			required: true
		},
		lastMessage: {
			type: Schema.Types.Mixed,
			default: {}
		},
		context: {
			type: Array,
			default: []
		}
	}, { minimize: false })
);
