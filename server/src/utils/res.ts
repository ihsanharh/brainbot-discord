import { REST } from '@discordjs/rest';

import { BotToken } from "./config";

export const res: REST = new REST({ version: '10' }).setToken(BotToken);