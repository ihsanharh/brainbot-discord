import { model, Schema } from 'mongoose';

interface ProxyIn {
	available?: boolean;
	banned?: boolean;
	instance?: string;
	ip_address?: string;
	port?: string;
	auth?: any;
}

export default model(
	"proxy",
	new Schema<ProxyIn>({
		available: {
			type: Boolean,
			default: true
		},
		banned: {
			type: Boolean,
			default: false
		},
		instance: {
			type: String,
			default: "Unused"
		},
		ip_address: {
			type: String,
			required: true
		},
		port: {
			type: String,
			required: true
		},
		auth: {
			user: {
				type: String,
				default: null
			},
			password: {
				type: String,
				default: null
			}
		}
	})
)
