#ifndef BRAINBOT_LISTENERS_H
#define BRAINBOT_LISTENERS_H

#include "brainbot.h"
#include "nlohmann/json.hpp"

namespace Listeners
{
	void bind();
	// Listen to Discord Events
	void onChannelUpdate(const dpp::channel_update_t &event);
	void onGuildCreate(const dpp::guild_create_t &event);
	void onGuildDelete(const dpp::guild_delete_t &event);
	void onGuildMemberUpdate(const dpp::guild_member_update_t &event);
	void onMessageCreate(const dpp::message_create_t &event);
	void onMessageUpdate(const dpp::message_update_t &event);
	void onReady(const dpp::ready_t &event);
	
	// Listen to Redis Events
	void onKeyExpires(std::string pattern, std::string channel, std::string message);
}

#endif // BRAINBOT_LISTENERS_H