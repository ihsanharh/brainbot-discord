import * as Discord from 'discord.js';
import * as fs from 'fs';

export class Client extends Discord.Client {
	public commands: any;
	
	constructor() {
		super({
			makeCache: Discord.Options.cacheWithLimits({
				MessageManager: 5
			}),
			intents: ["DIRECT_MESSAGES", "GUILDS", "GUILD_MESSAGES"],
			sweepers: {
				messages: {
					interval: 60000,
					lifetime: 60
				}
			}
		});
		
		this.commands = new Discord.Collection();
	}
	
	launch(): void {
		this.prepare();
		this.login(process.env.TOKEN);
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
		 * All bot events handled here
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
