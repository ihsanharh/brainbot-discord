import { WebhookClient } from 'discord.js'

export default async (message: string, client: any) => {
	if (process.env.NODE_ENV === "development") {
		console.log(message);
	}
}
