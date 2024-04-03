#include "listeners.h"
#include <chrono> // chrono

void Listeners::onKeyExpires(std::string pattern, std::string channel, std::string message)
{
	std::string key = message;
	std::string shadow_identifier = "shadow:";
	
	if (std::string::size_type pos = key.find(shadow_identifier+"session:") != std::string::npos)
	{
		std::string session_id = key.substr(shadow_identifier.length());
		std::optional<std::string> get_session = Brain::REDIS->get(session_id);
		
		if (!get_session) return;
		
		nlohmann::json session_j = nlohmann::json::parse(*get_session);
		std::string proxy_id = session_j["proxy_id"].get<std::string>();
		std::string proxy = session_j["proxy"].get<std::string>();
		std::string agent = session_j["useragent"].get<std::string>();
		std::string proxy_agent = proxy + "$" + agent;
		std::string where = session_j["where"].get<std::string>();
		std::time_t t = std::chrono::system_clock::to_time_t(std::chrono::system_clock::now());
		std::ostringstream timestamp;
		timestamp << std::put_time(std::localtime(&t), "%FT%T%z");
		
		nlohmann::json session_store = {
			{"timestamp", timestamp.str()}
		};
		
		SPDLOG_TRACE("[@{}] Session expired", session_id);

		session_j.erase("content");
		session_j.erase("last_message_timestamp");
		session_j.insert(session_store.begin(), session_store.end());

		Brain::BOT->request(Brain::Env("SERVER_URL") + "/v1/database/session/", dpp::http_method::m_post, [](const dpp::http_request_completion_t& res) {}, session_j.dump(), "application/json", {
			{ "Accept", "application/json" },
			{ "Authorization", Brain::Env("SERVER_RSA") }
		});

		if (where == "GUILD")
		{
		    std::string guild_id = session_j["guild_id"].get<std::string>();
			nlohmann::json context = session_j["context"].get<nlohmann::json>();

			nlohmann::json update_count = {
				{"$inc", {
					{"count", context.size()}
				}}
			};

			Brain::BOT->request(Brain::Env("SERVER_URL") + "/v1/database/chat/" + guild_id, dpp::http_method::m_patch, [](const dpp::http_request_completion_t& res) {}, update_count.dump(), "application/json", {
				{ "Accept", "application/json" },
				{ "Authorization", Brain::Env("SERVER_RSA") }
			});
		}
		
		Brain::REDIS->del(session_id);
		Brain::REDIS->hdel("proxy_u", proxy_id);
		Brain::REDIS->hset("proxy", proxy_id, proxy_agent);
	}
}