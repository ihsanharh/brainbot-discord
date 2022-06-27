import { cutString, sendDWebhook } from "./index";

process.on('unhandledRejection', async (reason: any, p: any) => {
	const AError = `\`\`\`js\n${reason.stack}\n${p}\`\`\`\n**[Unhandled Promise Rejection]**`
	
	console.error(reason)
	sendDWebhook({
		content: `${cutString(AError, 1950)}`,
		username: `Brain Bot`
	}, process.env.ERROR_WEBHOOK);
});

process.on('uncaughtException', async (err: any) => {
	const AError = `\`\`\`js\n${err}\`\`\`\n**[Uncaught Exception Thrown]**`
	
	console.error(err)
	sendDWebhook({
		content: `${cutString(AError, 1950)}`,
		username: `Brain Bot`
	}, process.env.ERROR_WEBHOOK);
});
