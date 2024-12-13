#include "listeners.h"
#include <chrono> // chrono

#include <bsoncxx/builder/basic/document.hpp> // bsoncxx::builder::basic::make_document()
#include <bsoncxx/builder/basic/kvp.hpp> // bsoncxx::builder::basic::kvp()
#include <bsoncxx/stdx/string_view.hpp> // bsoncxx::stdx::string_view()
#include <bsoncxx/json.hpp> // bsoncxx::from_json()
#include <mongocxx/collection.hpp> // mongocxx::collection

void endSession(nlohmann::json session_j)
{
	mongocxx::collection session_collections = Brain::MONGO->database(Brain::Env("DATABASE_NAME")).collection("sessions");
	session_collections.insert_one(bsoncxx::from_json(bsoncxx::stdx::string_view(session_j.dump())));
	
	std::string where = session_j["where"].get<std::string>();
	if (where == "GUILD")
	{
		std::string guild_id = session_j["guild_id"].get<std::string>();
		nlohmann::json context = session_j["context"].get<nlohmann::json>();
		mongocxx::collection chat_collections = Brain::MONGO->database(Brain::Env("DATABASE_NAME")).collection("chats");

        chat_collections.update_one(bsoncxx::builder::basic::make_document(bsoncxx::builder::basic::kvp("_id", guild_id)),
			bsoncxx::builder::basic::make_document(bsoncxx::builder::basic::kvp("$inc", 
				bsoncxx::builder::basic::make_document(bsoncxx::builder::basic::kvp("count", static_cast<int64_t>(context.size())))
			))
		);
	}
}

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

		session_j.erase("content");
		session_j.erase("last_message_timestamp");

		endSession(session_j);
		
		Brain::REDIS->del(session_id);
		Brain::REDIS->hdel("proxy_u", proxy_id);
		Brain::REDIS->hset("proxy", proxy_id, proxy_agent);
	}
}