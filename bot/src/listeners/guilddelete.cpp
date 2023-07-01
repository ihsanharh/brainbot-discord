#include "listeners.h"
#include "xtra/alert.h"
#include "HttpStatusCodes_C++11.h"

void Listeners::onGuildDelete(const dpp::guild_delete_t &event)
{
	if (event.deleted->is_unavailable() == 1)
	{
		if (Brain::App["state"] == 2 && Brain::Unavailable_Guilds.find(std::to_string(event.deleted->id)) != Brain::Unavailable_Guilds.end())
		{
			std::cout << "(Event GUILD_DELETE) Kicked from unavailable guild." << std::endl;
			Brain::Unavailable_Guilds.erase(std::to_string(event.deleted->id));
		}
		
		return;
	}
	
	nlohmann::json delete_payload = {
		{ "id", std::to_string(event.deleted->id) }
	};
		
	Brain::BOT->request(Brain::Env("SERVER_URL")+"/_guild/delete", dpp::http_method::m_delete, [](const dpp::http_request_completion_t& res) {
		if (res.status != HttpStatus::toInt(HttpStatus::Code::OK)) std::cout << "[Event GUILD_DELETE] Failed to do DELETE request with status code: " << res.status << "\n" << res.body << std::endl;
	}, delete_payload.dump(), "application/json", {
		{ "Authorization", Brain::Env("SERVER_RSA") },
		{ "Content-Type", "application/json" }
	});
	
	alert_join_leave(Brain::Env("LEAVE_EMOJI")+" has been kicked from **"+event.deleted->name+"**\n**["+getGuildsCount()+"]**");
}