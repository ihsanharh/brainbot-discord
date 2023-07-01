#ifndef BRAINBOT_COLLECTOR_H
#define BRAINBOT_COLLECTOR_H

#include "brainbot.h"
#include "nlohmann/json.hpp"
#include "HttpStatusCodes_C++11.h"

void _collectorAck(const dpp::message_create_t& event);

#endif // BRAINBOT_COLLECTOR_H