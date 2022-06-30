import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import * as superagent from 'superagent';
import * as md5 from 'md5';

import { BotToken } from "../utils/config";

require('superagent-proxy')(superagent);

const { parentPort, workerData } = require('node:worker_threads');

const DiscordAPI = new REST({ version: "9" }).setToken(BotToken);
const message: any = JSON.parse(workerData.message);
const session: any = JSON.parse(workerData.session);

let cookies: any, cbsid: any, xai: any, lastResponse: any, lastCookieUpdate = 0;
let userAgent = session.userAgent;
let proxy = session.proxy;
let content = message.content.toLowerCase().replace(/brainbot|brain bot/g, "CleverBot");

parentPort.postMessage(JSON.stringify({ t: "LAST_MESSAGE_UPDATE", s: session, d: message }));

chat(content).then((response: any) => {
	response = response.toLowerCase().replace(/cleverbot|clever bot/g, "Brain Bot");
	
	triggerTypingIndicator();
	setTimeout(() => {
		reply({ content: `${response}` }).then((DiscordMessage: any) => {
			parentPort.postMessage(JSON.stringify({ t: "SESSION_ACK", s: session, d: { content: content, response: response } }))
		});
	}, response.length * 250);
}).catch((error) => {
	console.error(error);
	reply({ content: `\`\`\`\nOh no! something went wrong, Please try again in a few minutes.\`\`\`` });
})

async function chat(stimulus: string, language: string = "en") {
	const _context = session.context.slice();
	
	if (cookies === null || Date.now() - lastCookieUpdate >= 86400000) {
		const date = new Date();
		const req = await superagent.get(`https://www.cleverbot.com/extras/conversation-social-min.js?${date.getFullYear()}${date.getMonth().toString().padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}`)
		.proxy(proxy)
		.set("User-Agent", userAgent);
		
		cookies = req.header["set-cookie"];
		lastCookieUpdate = Date.now();
	}
	
	let payload = `stimulus=${escape(stimulus).includes("%u") ? escape(escape(stimulus).replace(/%u/g, "|")) : escape(stimulus)}&`;
	
	const reverseContext = _context.reverse();
	
	for (let i = 0; i < _context.length; i++) {
		payload += `vText${i + 2}=${escape(reverseContext[i]).includes("%u") ? escape(escape(reverseContext[i]).replace(/%u/g, "|")) : escape(reverseContext[i])}&`;
	}
	
	payload += `${language ? `cb_settings_language=${language}&` : ""}cb_settings_scripting=no&islearning=1&icognoid=wsf&icognocheck=`;
	payload += md5(payload.substring(7, 33));
	
	for (let i = 0; i < 15; i++) {
		try {
			const req = await superagent.post(`https://www.cleverbot.com/webservicemin?uc=UseOfficialCleverbotAPI${cbsid ? `&out=${encodeURIComponent(lastResponse)}&in=${encodeURIComponent(stimulus)}&bot=c&cbsid=${cbsid}&xai=${xai}&ns=2&al=&dl=&flag=&user=&mode=1&alt=0&reac=&emo=&sou=website&xed=&` : ""}`)
			.timeout({
				response: 10000,
				deadline: 60000,
			})
			.proxy(proxy)
			.set("Cookie", `${cookies[0].split(";")[0]}; _cbsid=-1`)
			.set("User-Agent", userAgent)
			.type("text/plain")
			.send(payload);
			
			cbsid = req.text.split("\r")[1];
			xai = `${cbsid.substring(0, 3)},${req.text.split("\r")[2]}`;
			lastResponse = req.text.split("\r")[0];
			
			return lastResponse;
		} catch (err) {
			if (err.status === 503) {
				await new Promise(resolve => setTimeout(resolve, 1000));
			} else {
				throw err;
			}
		}
	}
	
	throw "Failed to get a response after 15 tries";
}

export async function reply(payload: any) {
	try {
		const CurrentChannel: any = await DiscordAPI.get(Routes.channel(message.channelId));
		
		if (CurrentChannel.last_message_id !== message.id) Object.assign(payload, {
			allowed_mentions: {
				parse: [
					"roles",
					"users",
					"everyone"
				],
				replied_user: false
			},
			message_reference: {
				message_id: message.id
			}
		});
		
		return await DiscordAPI.post(Routes.channelMessages(message.channelId), {
			body: payload
		});
	} catch(error: any) {
		console.error(error);
		throw error;
	}
}

export async function triggerTypingIndicator() {
	try {
		return await DiscordAPI.post(Routes.channelTyping(message.channelId));
	} catch(error: any) {
		console.error(error);
		throw error
	}
}
