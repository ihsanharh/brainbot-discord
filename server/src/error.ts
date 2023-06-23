import * as process from 'node:process';

process.on("uncaughtException", (err: Error, origin: string) => {
	console.log(new Date());
	console.error(`got an error!`);
	console.error(err);
})