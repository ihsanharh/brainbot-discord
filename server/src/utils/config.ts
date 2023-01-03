/* configuration files for the server */
export const DiscordAppId: string = String(process.env.DISCORD_APP_ID);
export const DiscordAppPubKey: string = String(process.env.APP_PUB_KEY);
export const DatabaseUrl: string = String(process.env.DATABASE_URL);
export const Rsa: string = String(process.env.SERVER_RSA);
export const ServerPort: string = String(process.env.SERVER_PORT);
export const ServerUrl: string = String(process.env.SERVER_URL).replace("$SERVER_PORT", ServerPort);