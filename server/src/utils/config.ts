/* configuration files for the server */
const AppMode = (process.env.NODE_ENV === "production") ? 0 : 1;

export const BotToken: string = (AppMode === 0)? String(process.env.BRAIN_BOTD_TOKEN): String(process.env.DEV_BRAIN_BOTD_TOKEN);
export const DiscordAppId: string = (AppMode === 0)? String(process.env.DISCORD_APP_ID): String(process.env.DEV_DISCORD_APP_ID);
export const DiscordAppPubKey: string = (AppMode === 0)? String(process.env.APP_PUB_KEY): String(process.env.DEV_APP_PUB_KEY);
export const DiscordChannelStorage: string = String(process.env.DISCORD_CHANNEL_STORAGE);
export const DiscordCommandChannel: string = String(process.env.DISCORD_COMMAND_CHANNEL);
export const DatabaseUrl: string = String(process.env.DATABASE_URL);
export const Rsa: string = String(process.env.SERVER_RSA);
export const ServerPort: string = (AppMode === 0)? String(process.env.SERVER_PORT): String(Number(process.env.SERVER_PORT)+1);
export const ServerUrl: string = String(process.env.SERVER_URL).replace("$SERVER_PORT", ServerPort);
export const SdUrl: string = String(process.env.SD_URL);