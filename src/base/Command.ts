import { AuthorInterface, CommandOption, CommandPermission, Localizations } from "../utils/interfaces";
import { OwnerId, replaceAll } from "../utils";
import Colors from "../utils/colors";
import Emojis from "../utils/emojis";

export default class CommandBase {
	public author: AuthorInterface;
	public client: any;
	public colors: any;
	public command: any;
	public emojis: any;
	public name: string;
	public name_localizations?: Localizations;
	public description: string;
	public description_localizations?: Localizations;
	public permission: CommandPermission;
	public usages: string[];
	public options?: CommandOption[];
	public slash?: boolean;
	
	constructor(client: any, Command: any) {
		Object.defineProperties(this, {
			client: {
				value: client,
				writable: false
			},
			colors: {
				value: Colors,
				writable: false
			},
			emojis: {
				value: Emojis,
				writable: false
			}
		})
		
		Object.assign(this, Command);
	}
	
	async args(options: any) {
		var optionsArray = [];
		
		if (this.slash) {
			var get_options = this.command.options.get(options.name);
			
			if (get_options) {
				var type: any = {
					CHANNEL: "channel",
					ROLE: "role",
					BOOLEAN: "value",
					INTEGER: "value",
					NUMBER: "value",
					STRING: "value",
					USER: get_options.user ? "user" : "member"
				}
				
				let value = this.command.options._getTypedOption(options.name, get_options.type, [type[get_options.type]]);
				
				optionsArray.push(value[type[get_options.type]]);
			}
			
			return optionsArray;
		} else {
			if (options.mentions) {
				optionsArray = [...this.command.mentions[options.mentions].values()]
				
				if (optionsArray.length < 1) {
					for (let item of this.command.args) {
						try {
							const res = await this.client[options.mentions].fetch(item, { force: true, allowUnknownGuild: true });
							
							optionsArray.push(res)
						} catch(err) {
							return;
						}
					}
				}
				
				return optionsArray;
			}
			
			if (options.join) {
				return [this.command.args.slice(0).join(" ")]
			}
			
			return this.command.args;
		}
	}
	
	execute() {}
	
	InvalidUsage(messages: any, error: boolean = false) {
		var variables = {
			"{author.id}": this.command.author.id,
			"{current_channel}": `#${this.command.channel.name}`,
			"{current_channel.id}": this.command.channel.id,
			"{prefix}": this.command.prefix
		}
		
		let _text = `**Invalid command usage! ${messages.text}**`;
		
		if (this.usages.length > 1) {
			var examples = this?.usages.map((usage: any) => `\` ${replaceAll(usage, variables)} \``).join("\n  ");
			
			_text += `\n\n${this.emojis.questionmark} **Example(s) of usage**:\n  ${examples}`;
		}
		
		if (error) _text = `**Error: ${messages.text}**`;
		if (error && messages.reason) _text += `\n${messages.reason}`;
		
		return this.reply({
			embeds: [
				{
					color: this.colors["red.InvalidUsage"],
					description: `${this.emojis.xmark} ${_text}`
				}
			]
		});
	}
	
	async props(context: any) {
		this.author = context.author ?? null;
		this.command = context;
		this.slash = this.command.type === "APPLICATION_COMMAND" ? true : false
		
		return this.execute()
	}
	
	async reply(data: any) {
		return customReply(this.command, data);
	}
}

export const CommandHandler = async (context: any, client: any) => {
	if (context?.author.bot) return;
	
	const command = client.commands.get(context.commandName);
  
	if (command) {
		if (!context.guild) {
			return customReply(context, { content: `${Emojis["xmark"]} **Command is not available in DM.**` });
		}
		
		if (command.permission.author.length >= 1) {
			if (command.permission.author.includes("OWNER") && context.author.id !== OwnerId) return;
			
			var check_permission = context.channel.permissionsFor(context.member).missing(command.permission.author.filter((p: string) => p !== "OWNER"));
			
			if (check_permission.length >= 1) {
				return customReply(context, { content: `${Emojis['xmark']} **You can't use that.**` });
			}
		}
		
		try {
			return await command.props(context);
		} catch(reason: any) {
			console.error(reason);
		}
	}
}

export async function customReply(context: any, data: any) {
	if (context.type === "APPLICATION_COMMAND") {
		if (context.deferred) return context.editReply(data);
		
		return context.reply(data);
	} else {
		if (data.inline) {
			delete data.inline;
			
			return context.reply(data);
		}
		
		return context.channel.send(data);
	}
}
