import Command from "../base/Command";
import Database from "../database";

export default class SetupCommand extends Command {
	constructor(client: any) {
		super(client, {
			name: "setup",
			description: "Setup the chat bot!",
			permission: {
				author: ["MANAGE_GUILD"],
				me: ["VIEW_CHANNEL", "SEND_MESSAGES"]
			},
			usages: [],
			options: [
				{
					type: 7,
					name: "channel",
					description: "#channel mention to set",
					channel_types: [0],
					required: true
				}
			]
		});
	}
	
	async execute() {
		const TargetChannel = (await this.args({ name: "channel", mentions: "channels" }))[0];
		
		if (!TargetChannel) return this.InvalidUsage({ text: "Please mention a channel." })
		if (!TargetChannel.type || TargetChannel?.type !== "GUILD_TEXT") return this.InvalidUsage({ text: "Invalid channel was provided.", reason: "I only use Text based channel." });
		
		const checkPermission = TargetChannel.permissionsFor(this.client.user).missing(this.permission.me);
		
		if (checkPermission.length >= 1) {
			if (checkPermission.length === 1 && checkPermission[0] === this.permission.me[0]) return this.InvalidUsage({ text: `Uh oh I can't use ${TargetChannel} because i can't see that channel.`, reason: "Make sure i have ` View Channel ` permission for the channel." }, true);
			if (checkPermission.includes(this.permission.me[0])) return this.InvalidUsage({ text: `It looks like i can't see ${TargetChannel} and send messages there.`, reason: `I'm missing ${checkPermission.map((perm: any) => `\` ${perm.replace(/\-|\_/gm, " ").replace(/(\B\w)/gi, (lc: any) => lc.toLowerCase())} \``).join(" and ")} permission for the channel.` }, true);
			
			return this.InvalidUsage({ text: `I can't use ${TargetChannel} because I'm missing ${checkPermission.map((perm: any) => `\` ${perm.replace(/\-|\_/gm, " ").replace(/(\B\w)/gi, (lc: any) => lc.toLowerCase())} \``).join(" & ")} permission for the channel.` }, true);
		}
		
		const checkDatabase = await Database({
			collection: "chat",
			method: "find",
			values: { _id: this.command.guild.id }
		});
		
		if (checkDatabase) {
			Database({
				collection: "chat",
				method: "update",
				query: { _id: this.command.guild.id },
				values: { $set: { channel: TargetChannel?.id } }
			});
		} else {
			Database({
				collection: "chat",
				method: "create",
				values: {
					_id: this.command.guild.id,
					channel: TargetChannel?.id
				}
			})
		}
		
		return this.reply({
			content: `${this.emojis.check} Setup completed! You can talk to me in <#${TargetChannel.id}> now.`
		})
	}
}
