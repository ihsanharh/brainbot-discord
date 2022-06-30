export const agents = [
	"Mozilla/5.0 (compatible; MSIE 8.0; Windows 95; Trident/4.0)",
	"Mozilla/5.0 (Windows NT 5.2) AppleWebKit/5322 (KHTML, like Gecko) Chrome/38.0.846.0 Mobile Safari/5322",
	"Opera/9.82 (X11; Linux x86_64; en-US) Presto/2.11.299 Version/10.00",
	"Mozilla/5.0 (X11; Linux i686) AppleWebKit/5342 (KHTML, like Gecko) Chrome/39.0.853.0 Mobile Safari/5342",
	"Mozilla/5.0 (Windows; U; Windows NT 6.1) AppleWebKit/535.16.3 (KHTML, like Gecko) Version/4.0.4 Safari/535.16.3",
	"Mozilla/5.0 (compatible; MSIE 6.0; Windows NT 6.0; Trident/3.1)",
	"Opera/8.65 (Windows NT 6.0; en-US) Presto/2.8.292 Version/10.00",
	"Mozilla/5.0 (compatible; MSIE 5.0; Windows 98; Win 9x 4.90; Trident/5.0)",
	"Mozilla/5.0 (Windows NT 6.0; sl-SI; rv:1.9.0.20) Gecko/20171113 Firefox/37.0",
	"Opera/8.50 (Windows NT 5.01; sl-SI) Presto/2.10.282 Version/12.00"
]

export const BotId: string = process.env.NODE_ENV === "production" ? process.env.PROD_CLIENT_ID : process.env.DEV_CLIENT_ID;
export const BotToken: string = process.env.NODE_ENV === "production" ? process.env.PROD_TOKEN : process.env.DEV_TOKEN;
export const InstanceFile = process.env.NODE_ENV === "production" ? "./dist/instance/Instance.js" : "./src/instance/Instance.ts";
export const MainFile: string = process.env.NODE_ENV === "production" ? "./dist/brainbot.js" : "./src/brainbot.ts";

export const BotLogsChannel: string = process.env.BOT_LOGS_CHANNEL;
export const MessageLogsChannel: string = process.env.MESSAGE_LOGS_CHANNEL;
export const ShardsCount: number = 2;
