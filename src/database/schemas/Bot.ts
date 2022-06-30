import { model, Schema } from 'mongoose';

import {} from "../../utils/config";

export default model(
	"bot", new Schema({
		id: {
			type: String,
			default: null,
			required: true 
		},
		status: {
			api: {
				is: {
					type: String,
					default: "Operational"
				},
				history: {
					type: Array,
					default: []
				}
			},
			database:  {
				is: {
					type: String,
					default: "Operational"
				},
				history: {
					type: Array,
					default: []
				}
			},
			hosting:  {
				is: {
					type: String,
					default: "Operational"
				},
				history: {
					type: Array,
					default: []
				}
			}
		},
		maintenance: {
			type: Boolean,
			default: false
		},
		shards: {
			type: Array,
			default: []
		}
	})
)
