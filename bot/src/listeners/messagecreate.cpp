#include "listeners.h"
#include "chatter.h"
#include "collector.h"

void Listeners::onMessageCreate(const dpp::message_create_t &event)
{
	if ((event.msg.type == dpp::message_type::mt_application_command) == 1 && event.msg.author.id == Brain::BOT->me.id) _collectorAck(event.raw_event); // send to collector ack
	chatter(event.msg, nlohmann::json::parse(event.raw_event));
}