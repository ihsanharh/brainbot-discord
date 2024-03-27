/**
 * March 24th, 00:22 WIB
 * - Rewrite from netlify to vercel
 * March 24th, 02:02 WIB
 * - fix wrong comparison
 */

interface PredictionOutput {
	url: string;
	data: string;
}

interface CreatePayload {
	input: {
		[k:string]: string|number|unknown;
	}
	stream: boolean;
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs'

const replicateAApi = "https://replicate.com/api";

function replicateHeaders(model?: string): HeadersInit {
	return {
		"Accept": "application/json",
		"Connection": "keep-alive",
		"Content-Type": "application/json",
		"Host": "replicate.com",
	    "Origin": "https://replicate.com",
        "Referer": `https://replicate.com/${model ?? ""}`,
        "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0"
	} as HeadersInit;
}

const replicate = {
	/**
	 * get prediction
	 * @param {String} predictionId 
	 * @returns {Response} containing the prediction
	 */
	get(predictionId: string): Promise<Response> {
		return fetch(`${replicateAApi}/predictions/${predictionId}`, {
			headers: replicateHeaders()
		});
	},
	
	/**
	 * cancel prediction
	 * @param {String} predictionId 
	 * @returns {Response} containing the prediction
	 */
	stop(predictionId: string): Promise<Response> {
		return fetch(`${replicateAApi}/predictions/${predictionId}/stop`, {
			headers: replicateHeaders()
		});
	},

	/**
	 * create prediction
	 * @param {String} model 
	 * @param {CreatePayload} payload 
	 * @returns {Response} containing created prediction
	 */
	create(model: string, payload: CreatePayload): Promise<Response> {
		return fetch(`${replicateAApi}/models/${model}/predictions`, {
			method: 'POST',
			headers: replicateHeaders(model),
			body: JSON.stringify(payload),
		});
	}
}

/**
 * turn ArrayBuffer into base64
 * @param {ArrayBuffer} buffer - buffer source
 * @return {string} Base64 version of the given buffer
 */
function abtob64(buffer: ArrayBuffer): string {
	var binary = '';
	var bytes = new Uint8Array(buffer);
	var len = bytes.byteLength;
	for (var i = 0; i < len; i++)
	{
		binary += String.fromCharCode(bytes[i]);
	}
	
	return btoa(binary);
}

/**
 * Download any image from url or array of url and return the image as Buffer
 * @param {string|string[]} outputs - Array of url of image or string url image
 * @return {object} return array of/or object containing url and their respective ArrayBuffer
 */
async function bufferit(outputs: string[]|string): Promise<PredictionOutput[]> {
	if (typeof outputs === 'string')
	{
		const image = await fetch(outputs);
		
		if (image.ok)
		{
			let data = abtob64(await image.arrayBuffer());
			
			return [{
				url: outputs,
				data
			}];
		}
	}
	else
	{
		var results: PredictionOutput[] = [];
		
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

	return [];
}

/**
 * Vercel serverless functions
 */
export async function GET(req: Request): Promise<Response> {
	const prediction_id = req.headers.get("Prediction-Id");
	const buffer_it = req.headers.get("Include-B64");

	if (!prediction_id) return new Response("400: Bad request", {
		status: 400
	});
	
	const get_pred = await replicate.get(prediction_id);

	if (get_pred.ok) {
		const prediction = await get_pred.json();

		if (prediction.status === "succeeded" && (buffer_it && buffer_it === "true")) prediction.output = await bufferit(prediction.output);

		return new Response(JSON.stringify(prediction), {
			status: 200
		});
	} else {
		return new Response("404: Prediction Not Found.", {
			status: 404
		});
	}
}

export async function POST(req: Request): Promise<Response> {
	const { model, version, input } = await req.json();
    
	if (!model || !version || !input) return new Response("Need model, version & other field filled", {
		status: 400
	});

	const create_pred = await replicate.create(`${model}/versions/${version}`, {
		input,
		stream: false
	});

	if (!create_pred.ok) return new Response("Failed to create prediction", {
		status: create_pred.status
	});

	return new Response(JSON.stringify(await create_pred.json()), {
		status: 200,
		headers: {
			"Content-Type": "application/json"
		}
	});
}

export async function DELETE(req: Request): Promise<Response> {
	const prediction_id = req.headers.get("Prediction-Id");

	if (!prediction_id) return new Response("400: Bad request", {
		status: 400
	});
	
	const get_pred = await replicate.get(prediction_id);

	if (!get_pred.ok) return new Response("Prediction not found.", {
		status: 404
	});

	replicate.stop(prediction_id);

	return new Response("Prediction cancelled.", {
		status: 202
	});
}