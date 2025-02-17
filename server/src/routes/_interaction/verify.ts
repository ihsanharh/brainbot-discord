import { verifyKey } from 'discord-interactions';
import { InteractionType, InteractionResponseType } from 'discord-api-types/v10';
import { NextFunction, Request, Response } from 'express';

import { DiscordAppPubKey } from "../../utils/config";

export function verifyInteraction(): (req: Request, res: Response, next: NextFunction) => void {
	return async (req: Request, res: Response, next: NextFunction) => {
		const timestamp = req.header('X-Signature-Timestamp') || '';
		const signature = req.header('X-Signature-Ed25519') || '';

		if (!timestamp || !signature) {
			res.status(401).end('Invalid signature');
			console.error('Invalid signature');

			return;
		}

		async function onBodyComplete(rawBody: Buffer) {
			const isValid = await verifyKey(rawBody, signature, timestamp, DiscordAppPubKey);

			if (!isValid) {
				res.status(401).end('Invalid signature');
				console.error('Invalid signature');

				return;
			}

			const body = JSON.parse(rawBody.toString('utf-8')) || {};

			if (body.type === InteractionType.Ping) {;
				res.header('Content-Type', 'application/json').end(JSON.stringify({
					type: InteractionResponseType.Pong
				}));

				return;
			}

			req.body = body;
			next();
		}
		
		const chunks: Array<Buffer> = [];

		req.on('data', (chunk: Buffer) => {
			chunks.push(chunk);
		});

		req.on('end', async () => {
			const rawBody = Buffer.concat(chunks);
			await onBodyComplete(rawBody);
		});
	};
}