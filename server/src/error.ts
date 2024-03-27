import * as process from 'node:process';

import logger from "./services/logger";

process.on("uncaughtException", (err: Error, origin: string) => {
	logger.fatal(err, origin);
});

process.on('unhandledRejection', (err: unknown) => {
  logger.error(err, "unhandled rejection.");
});