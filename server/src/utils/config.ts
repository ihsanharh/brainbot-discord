export const BotToken: string = String(process.env.BRAIN_BOTD_TOKEN);
export const DevMode: boolean = process.env.NODE_ENV == "development";

export const Dev: string = String(process.env.DEV);
export const DiscordAppId: string = String(process.env.DISCORD_APP_ID);
export const DiscordAppPubKey: string = String(process.env.APP_PUB_KEY);
export const DiscordChannelStorage: string = String(process.env.DISCORD_CHANNEL_STORAGE);
export const DiscordCommandChannel: string = String(process.env.DISCORD_COMMAND_CHANNEL);

export const DatabaseUrl: string = String(process.env.DATABASE_URL);
export const Rsa: string = String(process.env.SERVER_RSA);
export const RedisUrl: string = String(process.env.REDIS);

export const ServerPort: string = String(process.env.SERVER_PORT);
export const ServerUrl: string = String(process.env.SERVER_URL).replace("$SERVER_PORT", ServerPort);