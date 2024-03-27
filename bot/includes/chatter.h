#ifndef BRAINBOT_CHATTER_H
#define BRAINBOT_CHATTER_H

#include "brainbot.h"
#include "constants.h" // Constants
#include "discordlog.h" // DiscordLog
#include "date/date.h" // date
#include "HttpStatusCodes_C++11.h"
#include "nlohmann/json.hpp"

#include <chrono> // chrono
#include <regex> // regex
#include <thread> // thread
#include <vector> // vector

std::optional<std::pair<std::string, std::string>> obtain_proxy(std::string conversation_type);
long long iso_string_to_milliseconds(const std::istream&& iso_string);
bool compare_timestamp(const std::string& a, const std::string& b);
void chatter(const dpp::message &message, nlohmann::json raw_message);
void respond(const dpp::message &message, const std::chrono::time_point<std::chrono::system_clock> start, nlohmann::json raw_message);

#endif // BRAINBOT_CHATTER_H