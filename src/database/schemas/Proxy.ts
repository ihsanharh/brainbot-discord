import { model, Schema } from 'mongoose';

interface ProxyIn {
	available: boolean;
	banned?: boolean;
	ip_address?: string;
	port?: string;
	auth: {
		user: string;
		password: string;
	};
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
