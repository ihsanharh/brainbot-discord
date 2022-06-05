import { model, Schema } from 'mongoose';

interface Blocked {
	id: string;
	type: string;
	reason: string;
	temporary?: boolean;
	at?: string | null;
}

export default model(
	"blocked", new Schema<Blocked>({
		id: {
			type: String,
			required: true
		},
		type: {
			type: String,
			required: true
		},
		reason: {
			type: String,
			default: "Unspecified."
		},
		temporary: {
			type: Boolean,
			default: false
		},
		at: {
			type: String,
			default: null
		}
	})
)
