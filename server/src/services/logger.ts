import pino from 'pino';

import { DevMode } from "../utils/config";

const Logger = pino(DevMode? {
	transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
}: {});

export default Logger;