#ifndef BRAINBOT_XTRA_ALERT_H
#define BRAINBOT_XTRA_ALERT_H
#define CPPHTTPLIB_OPENSSL_SUPPORT

#include "brainbot.h"
#include "nlohmann/json.hpp"
#include "constants.h"
#include "httplib.h"
#include "HttpStatusCodes_C++11.h"

void alert_join_leave(const std::string& message);
void send_hi_message(const std::string& guildId);
std::string getGuildsCount();

#endif // BRAINBOT_XTRA_ALERT_H