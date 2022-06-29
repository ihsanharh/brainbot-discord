import { model, Schema } from 'mongoose';

interface Blacklist {
	id: string;
	type: string;
	reason: string;
	temporary?: boolean;
	at?: string | null;
}

export default model(
	"blacklist", new Schema<Blacklist>({
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
