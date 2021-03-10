const http = require('http');
const express = require('express');
const app = express();
var server = http.createServer(app);

app.get('/', (request, response) => {
	response.writeHead(200, { 'Content-Type': 'text/plain' });
	response.end('Brain Bot Discord, no open source.');
});

app.get('/vdo', (request, response) => {
	let vdo = request.query.url;
	if (!vdo) return response.send('Something Wrong :/');
	response.set('Content-Type', 'text/html');
});

const listener = server.listen(process.env.PORT, function() {
	console.log(`Your app is listening on port ` + listener.address().port);
});

require('./brainbot.js');