#include "listeners.h"
#include "collector.h"

void Listeners::onMessageCreate(const dpp::message_create_t &event)
{
	if ((event.msg.type == dpp::message_type::mt_application_command) == 1 && event.msg.author.id == Brain::BOT->me.id) _collectorAck(event); // send to collector ack
}