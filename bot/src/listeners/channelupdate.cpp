#include "listeners.h"
#include "constants.h"

void Listeners::onChannelUpdate(const dpp::channel_update_t &event)
{
	std::string guild_id = std::to_string(event.updating_guild->id);
	std::string channel_id = std::to_string(event.updated->id);
	std::string key = "channel:" + guild_id + ":" + channel_id;
	std::optional<std::string> is_curr_used = Brain::REDIS->get(key);
	
	if (!is_curr_used) return;
	
	SPDLOG_TRACE("[Cache] Updating channel #{}", channel_id);
	
	nlohmann::json raw_event = nlohmann::json::parse(event.raw_event);
	nlohmann::json channel_str = raw_event["d"].get<nlohmann::json>();
	
	std::cout << channel_str.dump() << std::endl;
	Brain::REDIS->setex(key, Constants::TTL::ChannelCache, channel_str.dump());
}