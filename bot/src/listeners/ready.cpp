#include "listeners.h"

void Listeners::onReady(const dpp::ready_t &event)
{
	nlohmann::json raw_event = nlohmann::json::parse(event.raw_event);
	
	for (auto& guild : raw_event["d"]["guilds"])
	{
		Brain::Unavailable_Guilds.insert({guild["id"], true});
	}
	
	spdlog::info("[Shard {}] {}'s ready!", event.shard_id, Brain::BOT->me.username);
}