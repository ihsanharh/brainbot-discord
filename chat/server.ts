import Fastify, { FastifyInstance } from 'fastify';
import * as md5 from 'md5';
import * as superagent from 'superagent';

interface ChatResponse {
	status: number;
	content: string;
	timestamp: number;
}

interface ReqJson {
    content: string;
    context: string[];
    useragent: string;
    version: string;
}

const App: FastifyInstance = Fastify({
    logger: true
});

let cookies: string, cbsid: string, xai: string, lastResponse: string, app_status: number, lastCookieUpdate: number = 0;

App.route({
    method: "GET",
    url: "/_health",
    schema: {
        response: {
            200: {
                type: "object",
                properties: {
                    status: { type: "number" }
                }
            }
        }
    },
    handler: (request, reply) => {
        var status = app_status? app_status: 200;

        reply.status(status).send({ status });
    }
});

App.route({
    method: "POST",
    url: "/hello",
    schema: {
        body: {
            type: "object",
            required: ["content", "context", "useragent"],
            properties: {
                content: {
                    type: "string"
                },
                context: {
                    type: "array",
                    items: { type: "string" }
                },
                useragent: {
                    type: "string"
                },
                version: {
                    type: "string"
                }
            }
        },
        response: {
            200: {
                type: "object",
                properties: {
                    status: { type: "number" },
                    content: { type: "string" },
                    timestamp: { type: "number" }
                }
            }
        }
    },
    handler: async (request, reply) => {
        const { content, context, useragent, version } = request.body as ReqJson;
        const { status, ...data } = await chat(content, useragent, context, version);

        app_status = status
        
        reply.status(status).send(data);
    }
});

try {
    App.listen({ port: 3000 });
} catch (err) {
    throw err;
}

async function chat(stimulus: string, userAgent: string, context: string[] = [], language: string = "en", usev2?: string): Promise<ChatResponse>
{
	const V2 = usev2? true: false;
	const _context = context.slice(); // clone array to prevent subsequent calls from modifying it
	
	if (cookies == null || Date.now() - lastCookieUpdate >= 86400000) {
		// we must get the XVIS cookie before we can make requests to the API
		const date = new Date();
		const req = await superagent.get(`https://www.cleverbot.com/extras/conversation-social-min.js?${date.getFullYear()}${date.getMonth().toString().padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}`).set("User-Agent", userAgent);
		cookies = req.header["set-cookie"]; // eslint-disable-line require-atomic-updates
		lastCookieUpdate = Date.now();
	}
	
	// why, cleverbot, why do you do need me to do this
	let payload = `stimulus=${escape(stimulus).includes("%u") ? escape(escape(stimulus).replace(/%u/g, "|")) : escape(stimulus)}&`;
	
	// we're going to assume that the first item in the array is the first message sent
	const reverseContext = _context.reverse();
	
	for (let i = 0; i < _context.length; i++) {
		// we're going to assume that the context hasn't been escaped
		payload += `vText${i + 2}=${escape(reverseContext[i]).includes("%u") ? escape(escape(reverseContext[i]).replace(/%u/g, "|")) : escape(reverseContext[i])}&`;
	}
	
	payload += `${language ? `cb_settings_language=${language}&` : ""}cb_settings_scripting=no&islearning=1&icognoid=wsf&icognocheck=`;
	payload += md5(payload.substring(7, 33));
	
	for (let i = 0; i < 15; i++) {
		try {
			const req = await superagent.post(`https://www.cleverbot.com/webservicemin?uc=UseOfficialCleverbotAPI${V2? "&ncf=v2":""}${cbsid ? `&out=${encodeURIComponent(lastResponse)}&in=${encodeURIComponent(stimulus)}&bot=c&cbsid=${cbsid}&xai=${xai}&ns=2&al=&dl=&flag=&user=&mode=1&alt=0&reac=&emo=&sou=website&xed=&` : ""}`)
			.timeout({
				response: 10000,
				deadline: 60000,
			})
			.set("Cookie", `${cookies[0].split(";")[0]}; _cbsid=-1`)
			.set("User-Agent", userAgent)
			.type("text/plain")
			.send(payload);
			
			cbsid = req.text.split("\r")[1];
			xai = `${cbsid.substring(0, 3)},${req.text.split("\r")[2]}`;
			lastResponse = req.text.split("\r")[0];
			
			return <ChatResponse>{
				status: 200,
				content: lastResponse,
				timestamp: Date.now()
			};
		} catch (err: any) {
			if (err.status === 503) {
				// retry after a bit
				await new Promise(resolve => setTimeout(resolve, 1000));
			} else if (err.status === 403) {
				return <ChatResponse>{
					status: 403,
					content: "",
					timestamp: Date.now()
				}
			} else {
				console.error(err);
				return <ChatResponse>{
					status: 404,
					content: "Something went wrong",
					timestamp: Date.now()
				}
			}
		}
	}
	
	throw new Error("Failed to get a response after 15 tries.");
}