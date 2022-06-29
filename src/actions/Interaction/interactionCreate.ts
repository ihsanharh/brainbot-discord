import { CommandHandler } from "../../base/Command";

export default async (interaction: any, client: any) => {
	if (interaction.user.id !== "591416431598632980") return;
	
	Object.defineProperties(interaction, {
		author: {
			value: interaction.user,
			writable: true
		},
		prefix: {
			value: "/",
			writable: false
		}
	});
	
	if (interaction.isCommand()) {
		CommandHandler(interaction, client);
	}
}
