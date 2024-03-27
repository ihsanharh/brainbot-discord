#include "listeners.h"
#include "constants.h"

void Listeners::onGuildMemberUpdate(const dpp::guild_member_update_t &event)
{
	std::string guild_id = std::to_string(event.updating_guild->id);
	std::optional<std::string> is_curr_used = Brain::REDIS->get("me_member:" + guild_id);
	
	if (!is_curr_used) return;
	
	SPDLOG_TRACE("[Cache] Updating me_member for {}", guild_id);
	
	nlohmann::json raw_event = nlohmann::json::parse(event.raw_event);
	nlohmann::json updated_me_member = raw_event["d"].get<nlohmann::json>();
	
	Brain::REDIS->setex("me_member:" + guild_id, Constants::TTL::MeMemberCache, updated_me_member.dump());
}