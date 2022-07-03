import { CommandHandler } from "../../base/Command";
import { OwnerId } from "../../utils";

export default async (interaction: any, client: any) => {
	if (process.env.BS === "DEV") {
		if (interaction.user.id !== OwnerId) return;
	}
	
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
