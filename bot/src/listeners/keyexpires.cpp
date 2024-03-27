#include "listeners.h"

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
		
		SPDLOG_TRACE("[@{}] Session expired", session_id);
		
		Brain::REDIS->del(session_id);
		Brain::REDIS->hdel("proxy_u", proxy_id);
		Brain::REDIS->hset("proxy", proxy_id, proxy_agent);
	}
}