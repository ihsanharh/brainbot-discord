import { WebhookClient } from 'discord.js';

import { cutString } from "./index";

process.on('unhandledRejection', async (reason: any, p: any) => {
	console.error(reason)
	SendHook(`\`\`\`js\n${reason.stack}\n${p}\`\`\`\n**[Unhandled Promise Rejection]**`);
});

process.on('uncaughtException', async (err: any) => {
	console.error(err)
	SendHook(`\`\`\`js\n${err}\`\`\`\n**[Uncaught Exception Thrown]**`);
});

async function SendHook(error: any) {
	const webhook = new WebhookClient({ url: process.env.ERROR_WEBHOOK });
	
	return await webhook.send({ content: `${cutString(error, 1950)}`, username: "Brain Bot fo" });
}
