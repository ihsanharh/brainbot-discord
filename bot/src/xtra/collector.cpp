#include "collector.h"

void _collectorAck(const std::string& raw_event)
{
	const nlohmann::json json_event = nlohmann::json::parse(raw_event);
	
	Brain::BOT->request(Brain::Env("SERVER_URL")+"/_collector/_active", dpp::http_method::m_get, [json_event](const dpp::http_request_completion_t& res) {
		if (res.status == HttpStatus::toInt(HttpStatus::Code::OK))
		{
			nlohmann::json json_res = nlohmann::json::parse(res.body);
			nlohmann::json json_message = json_event["d"];
			nlohmann::json json_components = json_event["d"]["components"];
			std::vector<std::string> active_collector = json_res["active"].get<std::vector<std::string>>();
			
			for (auto& i : json_components)
			{
				for (auto& j : i["components"])
				{
					std::string mixed_state = j["custom_id"].get<std::string>();
					size_t last_i = mixed_state.find_last_of(".");
					std::string get_state = "clr0" + mixed_state.substr(last_i+1);
					
					if (std::find(active_collector.begin(), active_collector.end(), get_state) != active_collector.end())
					{
						nlohmann::json payload = {
							{ "state", get_state },
							{ "message", json_message.dump() }
						};
						
						Brain::BOT->request(Brain::Env("SERVER_URL")+"/_collector/message", dpp::http_method::m_post, [](const dpp::http_request_completion_t& res) {}, payload.dump(), "application/json", {
							{ "Authorization", Brain::Env("SERVER_RSA") },
							{ "Content-Type", "application/json;charset=utf-8" }
						});
						break;
					}
				}
			}
		}
	}, "", "application/json", {
		{ "Accept", "application/json"},
		{ "Authorization", Brain::Env("SERVER_RSA") }
	});
}