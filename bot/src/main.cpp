#include "brainbot.h"
#include "listeners.h"

dpp::cluster Client(Brain::Env("BRAIN_BOTD_TOKEN"), Brain::Enabled_GatewayIntents, std::stoi(Brain::Env("SHARDS_COUNT")));
dpp::cluster* Brain::BOT = &Client;

void Listeners::bind()
{
	Brain::BOT->on_guild_create(onGuildCreate);
	Brain::BOT->on_guild_delete(onGuildDelete);
	Brain::BOT->on_message_create(onMessageCreate);
	Brain::BOT->on_ready(onReady);
}

int main()
{
	Listeners::bind();
	Brain::BOT->start(dpp::st_wait);
	return 0;
}