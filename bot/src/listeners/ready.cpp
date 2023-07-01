#include "listeners.h"

void Listeners::onReady(const dpp::ready_t &event)
{
	nlohmann::json raw_event = nlohmann::json::parse(event.raw_event);
	Brain::App["state"] = 0;
	
	for (auto& guild : raw_event["d"]["guilds"])
	{
		Brain::Unavailable_Guilds.insert({guild["id"], true});
	}
	
	std::cout << "(Shard " << event.shard_id << ") " << Brain::BOT->me.username << "'s ready!\n";
}