import { CommandHandler } from "../../base/Command";

export default async (interaction: any, client: any) => {
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
