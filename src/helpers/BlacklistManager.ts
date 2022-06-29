import Database from "../database";

export default async (message: any) => {
	const Blacklisted = await Database({
		collection: "blacklist",
		method: "find",
		query: {},
		unlimited: true
	});
	var res: boolean = false
	
	if (Blacklisted.length >= 1) {
		const BlacklistedUsers = Blacklisted.filter((bl: any) => bl.type === "USER").map((user: any) => user.id);
		console.log(BlacklistedUsers)
		if (message.guild) {
			const BlacklistedGuilds = Blacklisted.filter((bl: any) => bl.type === "GUILD").map((guild: any) => guild.id);
			
			if (BlacklistedGuilds.includes(message?.guild?.id)) res = true
		}
		
		if (BlacklistedUsers.includes(message.author.id)) res = true
	}
	
	return res;
}
