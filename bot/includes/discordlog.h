#ifndef DISCORD_LOG_H
#define DISCORD_LOG_H

#include "brainbot.h"
#include "constants.h"

namespace DiscordLog
{
	void send(const dpp::message &message, const std::string &content, bool self);
}

#endif // DISCORD_LOG_H