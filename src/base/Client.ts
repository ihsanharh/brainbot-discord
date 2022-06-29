import * as Discord from 'discord.js';
import * as fs from 'fs';

import { BotToken } from "../utils/config";

export class Client extends Discord.Client {
	public commands: Discord.Collection<string | number, any>;
	public sessions: Discord.Collection<string | number, any>;
	
	constructor() {
		super({
			makeCache: Discord.Options.cacheWithLimits({
					/**
					 * Unsupported manager to be limited according to discord.js.org:
					 * - GuildManager
					 * - ChannelManager
					 * - GuildChannelManager
					 * - RoleManager
					 * - PermissionOverwriteManager
					 */
				MessageManager: {
					maxSize: 5
				},
				UserManager: {
					maxSize: 5
				}
			}),
			partials: ["CHANNEL", "MESSAGE"],
			intents: ["DIRECT_MESSAGES", "GUILDS", "GUILD_MESSAGES"],
			sweepers: {
				emojis: {
					interval: 60,
					filter: () => {return null}
				},
				invites: {
					interval: 60,
					lifetime: 60
				},
				guildMembers: {
					interval: 60,
					filter: () => {return null}
				},
				messages: {
					interval: 60,
					lifetime: 60
				},
				reactions: {
					interval: 60,
					filter: () => {return null}
				},
				threads: {
					interval: 60,
					lifetime: 60
				},
				users: {
					interval: 60,
					filter: () => {return null}
				}
			}
		});
		
		this.commands = new Discord.Collection();
		this.sessions = new Discord.Collection();
	}
	
	launch(): void {
		this.prepare();
		this.login(BotToken);
	}
	
	prepare(): void {
		/**
		 * Load all commands
		 */
		fs.readdirSync(__dirname.replace("base", "") + "/commands/").forEach(async (CommandFile: any) => {
			const command: any = new (await import(`../commands/${CommandFile}`)).default(this);
			this.commands.set(command.name, command);
		});
		
		
		/**
		 * All events received from Discord handled here
		 */
		fs.readdirSync(__dirname.replace("base", "") + "/actions/").forEach((ActionCategory: any) => {
			fs.readdirSync(__dirname.replace("base", "") + `/actions/${ActionCategory}`).forEach(async (ActionFile: any) => {
				const Action: any = (await import(`../actions/${ActionCategory}/${ActionFile}`)).default;
				
				this.on(ActionFile.replace(/\.[^/.]+$/, ""), (...args: any) => {
					Action(...args, this);
				});
			});
		});
	}
}
