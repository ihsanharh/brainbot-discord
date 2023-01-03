import { REST } from '@discordjs/rest';

export const res: REST = new REST({ version: '10' }).setToken(process.env.BRAIN_BOTD_TOKEN);