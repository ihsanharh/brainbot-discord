import { verifyKey } from 'discord-interactions';

import { DiscordAppPubKey } from "../../utils/config";

export const verifyDiscordRequest = () => {
	return function (req: any, res: any, buf: any, encoding: any) {
		const signature = req.get('X-Signature-Ed25519');
		const timestamp = req.get('X-Signature-Timestamp');
		
		const isValid = verifyKey(buf, signature, timestamp, DiscordAppPubKey);
		
		if (!isValid) {
			res.status(401).send("Bad request.");
			throw new Error('Bad request signature.');
		}
	}
}