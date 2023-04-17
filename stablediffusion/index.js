import http from 'node:http';
import replicate from 'node-replicate';
import { fetch } from 'undici';

http.createServer((req, res) => {
	var { authorization } = req.headers;
	var authKey = process.env.KEY;
	
	if (req.method === "GET") return res.writeHead(200).end("hi!");
	if (req.method !== "POST") return;
	if (!authorization || authorization !== authKey) {
		console.log("unrecognised request.");
		return res.writeHead(404).end();
	}
	else {
		let body = "";
		
		req.on('data', (chunk) => {
			body += chunk;
		});
		
		req.on('end', async () => {
			var { model, t, asbuffer, ...input } = JSON.parse(body);
			
			const images = await replicate.run(model, input);
			
			res.writeHead(200).end(JSON.stringify({
				output: asbuffer? await bufferit(images): images,
			}));
		});
	}
}).listen(process.env.PORT);

async function bufferit(outputs) {
	if (typeof outputs === 'string') {
		const image = await fetch(outputs);
		
		if (image.ok) {
			let data = abtob64(await image.arrayBuffer());
			
			return {
				url: outputs,
				data
			};
		}
	} else {
		var results = [];
		
		for (let i = 0; i < outputs.length; i++) {
			const image = await fetch(outputs[i]);
			
			if (image.ok) {
				let data = abtob64(await image.arrayBuffer());
				
				results.push({
					url: outputs[i],
					data
				});
			}
		}
		
		return results;
	}
}

function abtob64(buffer) {
	var binary = '';
	var bytes = new Uint8Array(buffer);
	var len = bytes.byteLength;
	for (var i = 0; i < len; i++)
	{
		binary += String.fromCharCode(bytes[i]);
	}
	
	return btoa(binary);
}