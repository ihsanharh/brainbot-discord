require('dotenv').config({
	path: __dirname.substring(0, (__dirname.substring(0, __dirname.lastIndexOf("/"))).lastIndexOf("/")) + "/.env"
});

const fastify = require('fastify')();

const SessionManager = require("./manager.js");
const GuildRecord = require("./modules/guild.js");

fastify.addHook('onRequest', (request, response, done) => {
	if (request.headers["authorization"] !== process.env.CHATTER_RSA) return response.code(401).send({ "code": "401" });
	else done();
});

fastify.post("/_mafi", (request, response) => {
	if (request.body['t'] === "MESSAGE_CREATE") SessionManager(request.body['d']);
	
	return response.code(200).send({"done": "true"});
});

fastify.listen({ port: process.env.CHAT_PORT }, (err, address) => {
	if (err) {
		console.error(err);
		process.exit(1);
	} else {
		console.log(`Chat server listening @ ${address}`);
	}
});