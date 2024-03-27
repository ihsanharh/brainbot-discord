#ifndef BRAINBOT_COLLECTOR_H
#define BRAINBOT_COLLECTOR_H

#include "brainbot.h"
#include "nlohmann/json.hpp"
#include "HttpStatusCodes_C++11.h"

void _collectorAck(const std::string& raw_event);

#endif // BRAINBOT_COLLECTOR_H