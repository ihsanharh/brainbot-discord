import { WebhookClient } from 'discord.js';

import Emojis from "./emojis";

export function countdown(s: number) {
	const d = Math.floor(s / (3600 * 24));
	s  -= d * 3600 * 24;
	const h = Math.floor(s / 3600);
	s  -= h * 3600;
	const m = Math.floor(s / 60);
	s  -= m * 60;
	
	const tmp = [];
	
	(d) && tmp.push(d + (d > 1 ? ' days' : ' day'));
	(d || h) && tmp.push(h + (h > 1 ? ' hours' : ' hour'));
	(d || h || m) && tmp.push(m + (m > 1 ? ' minutes' : ' minute'));
	
	tmp.push(s + (s > 1 ? ' seconds' : ' second'));
	
	return tmp.join(' ');
}

export function cutString(Text: string, length: number) {
	if (Text == null) {
		return "";
	}
	if (Text.length <= length) {
		return Text;
	}
	
	Text = Text.substring(0, length);
	let last = Text.lastIndexOf(" ");
	Text = Text.substring(0, last);
	
	return Text + "...";
}

export async function getGuildsCount(client: any): Promise<number | string> {
	return client?.shard ? (await this.client?.shard?.fetchClientValues("guilds.cache.size")).reduce((prev: any, val: any) => prev + val, 0) : client?.guilds?.cache?.size;
}

export function sendDWebhook(data: any, webhook: string): void {
	const WebHook = new WebhookClient({ url: webhook });
	
	WebHook.send(data);
}

export function replaceAll(text: string, variable: any) {
	var re = new RegExp(Object.keys(variable).join("|"),"gi");
	
	return text.replace(re, function(matched) {
		return variable[matched.toLowerCase()];
	});
}

export const separateEmoji = (emoji: string) => {
	return Emojis[emoji as keyof typeof Emojis].replace(/<|>/g, "").split(":").filter((item: string) => item);
}
