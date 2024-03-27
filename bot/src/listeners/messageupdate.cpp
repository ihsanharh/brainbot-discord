#include "listeners.h"
#include "collector.h"

void Listeners::onMessageUpdate(const dpp::message_update_t &event)
{
	if ((event.msg.type == dpp::message_type::mt_application_command) == 1 && event.msg.author.id == Brain::BOT->me.id) _collectorAck(event.raw_event); // send to collector ack
}