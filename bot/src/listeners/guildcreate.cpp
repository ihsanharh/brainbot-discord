#include "listeners.h"
#include "HttpStatusCodes_C++11.h"
#include "xtra/alert.h"
#include <chrono> // chrono
#include <thread> // thread

std::chrono::time_point<std::chrono::system_clock> expected_guilds_out;

void check_ready()
{
	std::chrono::time_point<std::chrono::system_clock> out_now = std::chrono::system_clock::now();
	std::chrono::duration is_thirty_seconds = std::chrono::duration_cast<std::chrono::milliseconds>(out_now - expected_guilds_out);
	
	if (Brain::Unavailable_Guilds.empty() && Brain::App["state"] == 0)
	{ // if the expected guilds map empty clear it to free memory
		Brain::Unavailable_Guilds.clear();
		Brain::App["state"] = 1; // 1: Brain Bot is fully ready.
		std::cout << "(Var Unavailable_Guilds) All guilds is now available.\n";
	} else if (is_thirty_seconds.count() >= 30000)
	{
		Brain::App["state"] = 2; // 2: Brain Bot is ready while there's unavailable guilds.
		std::cout << "(Var Unavailable_Guilds) There are " << Brain::Unavailable_Guilds.size() << " unavailable guilds.\n";
	}
}

void Listeners::onGuildCreate(const dpp::guild_create_t &event)
{
	if (event.created->is_unavailable() == 1) return;
	if (Brain::App["state"] == 0 && Brain::Unavailable_Guilds.find(std::to_string(event.created->id)) != Brain::Unavailable_Guilds.end())
	{
		expected_guilds_out = std::chrono::system_clock::now();
		Brain::Unavailable_Guilds.erase(std::to_string(event.created->id));
		
		std::thread t([]() {
			std::this_thread::sleep_for(std::chrono::milliseconds(30000));
			check_ready();
		});
		t.detach();
		
		return;
	}
	
	nlohmann::json raw_event = nlohmann::json::parse(event.raw_event);
	nlohmann::json raw_created_guild = raw_event["d"].get<nlohmann::json>();
	nlohmann::json create_payload = {
		{ "id", std::to_string(event.created->id) },
		{ "shard_id", std::to_string(event.created->shard_id) },
		{ "guild", raw_created_guild.dump() }
	};
	
	Brain::BOT->request(Brain::Env("SERVER_URL")+"/_guild/create", dpp::http_method::m_post, [](const dpp::http_request_completion_t& res) {
		if (res.status != HttpStatus::toInt(HttpStatus::Code::OK)) std::cout << "[Event GUILD_CREATE] Failed to do POST request with status code: " << res.status << "\n" << res.body << std::endl;
	}, create_payload.dump(), "application/json", {
		{ "Authorization", Brain::Env("SERVER_RSA") },
		{ "Content-Type", "application/json" }
	});
	
	send_hi_message(std::to_string(event.created->id));
	alert_join_leave(Brain::Env("JOIN_EMOJI")+" has been added to **"+event.created->name+"**\n**["+getGuildsCount()+"]**");
}