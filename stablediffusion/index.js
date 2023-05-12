import http from 'node:http';
import replicate from 'node-replicate';
import { fetch } from 'undici';

const ActivePrediction = new Map();

http.createServer((req, res) => {
	var { authorization } = req.headers;
	var origin = req.headers['x-forwarded-for'];
	var authKey = process.env.KEY;
	
	console.log(`IncomingMessage from ${origin}`);
	if (!authorization || authorization !== authKey)
	{
		console.log(`${origin} unrecognised request.`);
		return res.writeHead(404).end();
	}
	else
	{
		var returnHeaders = {
			'Content-Type': 'application/json'
		}
		
		if (req.method === 'GET')
		{
			var { uuid } = req.query();
			
			if (!uuid) return res.writeHead(403).end();
			var prediction = ActivePrediction.get(uuid);
			
			if (prediction) return res
			.writeHead(200, returnHeaders)
			.end(JSON.stringify(prediction));
			else return res
			.writeHead(404)
			.end();
		}
		else if (req.method === 'POST')
		{
			let body = '';
			
			console.log(`(${origin}) POST request accepted`);
			
		  req.on('data', (chunk) => {
			  body += chunk;
		  });
		  
		  req.on('end', async () => {
		  	var { model, t, asbuffer, ...input } = JSON.parse(body);
			  let prediction = await replicate.create(model, input);
			  
			  console.log(`(${origin}) processing`);
			  
			  while(!['canceled', 'succeeded', 'failed'].includes(prediction.status))
			  {
				  await new Promise(_ => setTimeout(_, 250));
				  prediction = await replicate.get(prediction);
				  
				  ActivePrediction.set(prediction['uuid'], prediction);
			  }
			  
			  ActivePrediction.delete(prediction['uuid']);
			  console.log(`(${origin}) ${prediction.status}`);
			  
			  if (prediction.status === 'succeeded')
			  {
			  	return res
			  	.writeHead(200, returnHeaders)
			  	.end(JSON.stringify({
			  		output: asbuffer? await bufferit(prediction.output): prediction.output,
			  	}));
			  }
			  else if (prediction.status === 'canceled')
			  {
			  	return res
			  	.writeHead(204, returnHeaders)
			  	.end({
			  		'output': false
			  	});
			  }
			  else if (prediction.status === 'failed')
			  {
			  	return res
			  	.writeHead(500, returnHeaders)
			  	.end({
				    'output': false
			    });
			  }
		  });
		}
	}
}).listen(process.env.PORT);

async function bufferit(outputs)
{
	if (typeof outputs === 'string')
	{
		const image = await fetch(outputs);
		
		if (image.ok)
		{
			let data = abtob64(await image.arrayBuffer());
			
			return {
				url: outputs,
				data
			};
		}
	}
	else
	{
		var results = [];
		
		for (let i = 0; i < outputs.length; i++)
		{
			const image = await fetch(outputs[i]);
			
			if (image.ok)
			{
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

function abtob64(buffer)
{
	var binary = '';
	var bytes = new Uint8Array(buffer);
	var len = bytes.byteLength;
	for (var i = 0; i < len; i++)
	{
		binary += String.fromCharCode(bytes[i]);
	}
	
	return btoa(binary);
}

http.IncomingMessage.prototype.query = function() {
	var asString = String(this.url).split('?').slice(1).join();
	if (asString.length < 1) return {}
	
	var cleaned = asString.replaceAll('&', '","').replaceAll('=', '":"');
	return JSON.parse('{"' + cleaned + '"}');
}