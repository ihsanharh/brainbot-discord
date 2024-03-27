#include "listeners.h"
#include "xtra/alert.h"

void Listeners::onGuildDelete(const dpp::guild_delete_t &event)
{
	std::string guild_id = std::to_string(event.deleted.id);
	
	if (event.deleted.is_unavailable() == 1)
	{
		if (Brain::Unavailable_Guilds.find(guild_id) != Brain::Unavailable_Guilds.end())
		{
			Brain::Unavailable_Guilds.erase(guild_id);
			spdlog::info("[Event GUILD_DELETE] Kicked from unavailable guild ({}).", guild_id);
		}
		else
		{
			Brain::Unavailable_Guilds.insert({guild_id, true});
			spdlog::info("[Event GUILD_DELETE] +1 Unavailable guild ({}).", guild_id);
		}
		
		return;
	}
	
	alert_join_leave(Constants::Emojis::leave+" has been kicked from **"+event.deleted.name+"**\n**["+std::to_string(get_guild_count())+"]**");
}