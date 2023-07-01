#ifndef BRAINBOT_LISTENERS_H
#define BRAINBOT_LISTENERS_H

#include "brainbot.h"
#include "nlohmann/json.hpp"

namespace Listeners
{
	void bind();
	
	void onGuildCreate(const dpp::guild_create_t &event);
	void onGuildDelete(const dpp::guild_delete_t &event);
	void onMessageCreate(const dpp::message_create_t &event);
	void onReady(const dpp::ready_t &event);
}

#endif // BRAINBOT_LISTENERS_H