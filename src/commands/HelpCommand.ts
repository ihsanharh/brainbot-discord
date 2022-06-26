import { OwnerId } from "../utils"
import Command from "../base/Command";
import Database from "../database";

export default class HelpCommand extends Command {
	constructor(client: any) {
		super(client, {
			name: "help",
			description: "Show the Help menu",
			permission: {
				author: [],
				me: []
			},
			usages: [],
			options: [
				{
					type: 3,
					name: "choice",
					description: "Category you need help with.",
					required: false,
					choices: [
						{
							name: "Commands list",
							value: "commands"
						}
					]
				}
			]
		})
	}
	
	async execute(): Promise<any> {
		if (this.slash) await this.command.deferReply();
		
		const separateEmoji = (emoji: string) => {
			return this.emojis[emoji].replace(/<|>/g, "").split(":").filter((item: string) => item);
		}
		
		var CommandsEmbed: any = {
			title: "Commands List",
			description: this.client.commands.filter((command: any) => {
				const permissions = this.command.member.permissions.toArray();
				if (this.command.author.id === OwnerId) permissions.push("OWNER");
				
				return command.permission.author.every((perm: string) => permissions.includes(perm))
			}).map((command: any) => {
				return `**${this.command.prefix}${command.name}**\n${command.description}`
			}).join("\n\n"),
			color: this.colors["blurple.MainColor"],
			thumbnail: {
				url: this.client.user.displayAvatarURL()
			}
		}
		
		var HelpEmbed: any = {
			title: "Welcome to Brain Bot's Help menu!",
			description: "it learns and imitates, is social content. can seem rude or inappropriate - talk with caution and at your own risk.\n\nthe bot pretends to be human - don't give personal info even if it 'asks'.\n\nBrain Bot does not understand you, and cannot mean anything it 'says'.",
			color: this.colors["blurple.MainColor"],
			thumbnail: {
				url: this.client.user.displayAvatarURL()
			}
		}
		
		var HelpSelect: any = {
			type: 3,
			custom_id: "HelpMenu.Select",
			options: [
				{
					label: "Commands list",
					value: "commands",
					description: "Show all available commands",
					emoji: {
						id: separateEmoji("slash")[1],
						name: separateEmoji("slash")[0]
					}
				}
			]
		}
		
		var BackToMenuButton: any = {
			type: 2,
			style: 2,
			label: "←  Back to Menu",
			custom_id: "HelpMenuBack.Button"
		}
		
		const SelectedChoice = (await this.args({ name: "choice" }))[0];
		
		if (SelectedChoice) {
			if (SelectedChoice === "commands") {
				return this.reply({
					embeds: [CommandsEmbed]
				})
			}
		}
		
		return this.reply({
			fetchReply: true,
			embeds: [HelpEmbed],
			components: [
				{
					type: 1,
					components: [HelpSelect]
				}
			]
		}).then((HelpMessage: any) => {
			HelpMessage.createMessageComponentCollector({ time: 120000 })
			.on('collect', (interaction: any) => {
				if (interaction.customId === "HelpMenu.Select") {
					return interaction.update({
						embeds: [CommandsEmbed],
						components: [
							{
								type: 1,
								components: [BackToMenuButton]
							}
						]
					})
				} else if (interaction.customId === "HelpMenuBack.Button") {
					return interaction.update({
						embeds: [HelpEmbed],
						components: [
							{
								type: 1,
								components: [HelpSelect]
							}
						]
					});
				}
			})
			.on('end', (collected: any) => {
				return HelpMessage.edit({ components: [] });
			})
		})
	}
}
