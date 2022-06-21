import * as util from 'util';

import { cutString } from "../utils";
import Command from "../base/Command";

export default class EvalCommand extends Command {
	constructor(client: any) {
		super(client, {
			name: "eval",
			description: "Evaluate something in JavaScript code.",
			permission: {
				author: ["OWNER"],
				me: []
			},
			usages: [],
			options: [
				{
					type: 3,
					name: "code",
					description: "Set of JavaScript code to execute",
					required: true
				}
			]
		})
	}
	
	async execute(): Promise<any> {
		if (this.slash) await this.command.deferReply();
		
		let code: string | any = (await this.args({ name: 'code', join: true }))[0];
		
    if (!code) return this.reply({ content: "give something to evaluate!" });
    
    var clean = async (text: string) => {
      if (text && text.constructor.name == "Promise") text = await text;
      if (typeof text !== "string") text = util.inspect(text, { depth: 1 });
      
      text = text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
      text = text.replaceAll(this.client.token, "Bot");
      
      return cutString(text, 1950);
    }
    
    try {
      var evaled = eval(code);
      var cleaned_result = await clean(evaled);
      
      return this.reply({ content: `\`\`\`js\n${cleaned_result}\n\`\`\`` });
    } catch (err) {
    	var cleaned_error = await clean(err);
    	
      return this.reply({ content: `\`\`\`js\n${cleaned_error}\n\`\`\`` });
    }
	}
}
