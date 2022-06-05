import { model, Schema } from 'mongoose';

interface Bot {
	[key: string]: any;
}

export default model(
	"bot", new Schema<Bot>({
		anything: {
			type: Object,
			required: true
		}
	})
)
