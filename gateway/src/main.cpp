/* SSL support for httplib.h */
#define CPPHTTPLIB_OPENSSL_SUPPORT

#include "libs/HttpStatusCodes_C++11.h"
#include "libs/brainbot.h"
#include "libs/httplib.h"
#include "libs/nlohmann/json.hpp"

#include <dpp/dpp.h>
#include <cstdlib>
#include <iostream>
#include <string>
#include <unordered_map>

const std::string BotToken = brainbot::Config::Token;
uint32_t enabled_intents = brainbot::Config::Enabled_GatewayIntents;
uint32_t shards_count = brainbot::Config::Shard_Count;
std::unordered_map<std::string, bool> Expected_Guilds;

dpp::cluster bot(BotToken, enabled_intents, shards_count);
httplib::Client discord_Api("https://discord.com");

std::string json_from_string(std::string raw_str)
{
	nlohmann::json j = nlohmann::json::parse(raw_str);
	
	return j.dump();
}

void check_ready()
{
	if (Expected_Guilds.empty())
	{
		std::cout << "[Expected_Guilds] " << "No more guilds to wait." << std::endl;
		Expected_Guilds.clear();
	}
	else
	{
		std::cout << "[Expected_Guilds] " << std::to_string(Expected_Guilds.size()) << " remaining guilds to wait." << std::endl;
	}
}

void alert_join_leave(const dpp::confirmation_callback_t* res, std::string message)
{
	if (res->is_error())
	{
		std::cout << res->get_error().message << std::endl;
	}
	else
	{
		const dpp::channel log_channel = std::get<dpp::channel>(res->value);
		dpp::permission log_channel_permissions = log_channel.get_user_permissions(&bot.me);
		if (bool checklog_channel_permissions = log_channel_permissions.has(dpp::p_view_channel, dpp::p_send_messages))
		{
			const dpp::message& log_message = dpp::message(log_channel.id, message);
			bot.message_create(log_message);
		}
		else
		{
			std::cout << "No permissions to sent message in join_leave_channel" << std::endl;
		}
	}
}

void send_hi_message(const dpp::confirmation_callback_t* res, const std::string guildId)
{
	if (res->is_error())
	{
		std::cout << res->get_error().message << std::endl;
	}
	else
	{
		httplib::Client Server("http://localhost:4094");
		dpp::channel_map channel_list = std::get<dpp::channel_map>(res->value);
		dpp::channel_map::iterator it = channel_list.begin();
			
		while (it != channel_list.end())
		{
			dpp::permission get_current_channel_permissions = it->second.get_user_permissions(&bot.me);
			bool is_allowed_to_send_here = get_current_channel_permissions.has(dpp::p_view_channel, dpp::p_send_messages);
			
			if (!it->second.is_text_channel() || !is_allowed_to_send_here)
			{
				it = channel_list.erase(it);
			} else {
				it++;
			}
		}
		
		if (channel_list.size() >= 1)
		{
			Server.set_default_headers({
				{ "Authorization", brainbot::Config::ServerRsa },
				{ "Accept", "application/json" }
			});
			std::string path = "/database/guild/"+guildId;
			httplib::Result guild_data = Server.Get(path);
			
			if (guild_data)
			{
				std::string message = "";
				const dpp::channel first_channel = channel_list.begin()->second;
				
				if (guild_data->status == HttpStatus::toInt(HttpStatus::Code::OK))
				{
					const nlohmann::json json_guild_data = nlohmann::json::parse(guild_data->body);
					message = brainbot::Message::AddedBack;
					if (!json_guild_data["channel"].is_null())
					{
						std::string channelId = json_guild_data["channel"];
						
						httplib::Result is_stored_channel_exist = discord_Api.Get((std::string)"/api/v10/channels/"+channelId, (httplib::Headers){
							{ "Authorization", (std::string)"Bot "+BotToken },
							{ "Accept", "application/json" }
						});
						
						if (is_stored_channel_exist)
						{
							std::string ContinueTalking = brainbot::Message::ContinueTalking;
							if (is_stored_channel_exist->status == HttpStatus::toInt(HttpStatus::Code::OK)) message += ContinueTalking.replace(ContinueTalking.find("<#cid>"), std::string("<#cid>").size(), channelId);
							else message += brainbot::Message::SetupFirstTime;
						}
						else
						{
							std::cout << is_stored_channel_exist.error() << std::endl;
						}
					}
					else
					{
						message += brainbot::Message::SetupFirstTime;
					}
				}
				else
				{
					message = brainbot::Message::FirstTime+brainbot::Message::SetupFirstTime;;
				}
				
				httplib::Result get_commands = Server.Get("/commands");
				const nlohmann::json json_commands = nlohmann::json::parse(get_commands->body);
				
				for (int i = 0; i < json_commands.size(); i++)
				{
					std::string key = "</"+(std::string)json_commands[i]["name"]+">";
					if (message.find(key) != std::string::npos) message.replace(message.find(key), key.size(), (std::string)json_commands[i]["id"]);
				}
				
				const dpp::message& hi_message = dpp::message(first_channel.id, message);
				bot.message_create(hi_message);
			}
			else
			{
				std::cout << "[Socket -> Send_Hi] HTTP Error: " << httplib::to_string(guild_data.error()) << std::endl;
			}
		}
	}
}

void handle_discord()
{
	httplib::Client chat("http://localhost:4093");
	
	bot.on_ready([](const dpp::ready_t& event) {
		nlohmann::json raw_event = nlohmann::json::parse(json_from_string(event.raw_event));
		for (auto& i : raw_event["d"]["guilds"])
		{
			Expected_Guilds.insert({i["id"], true});
		}
		
		std::cout << "[Shard " << event.shard_id << " -> WebSocket]" << " Connected to Discord as " << bot.me.username << "#" << std::to_string(bot.me.discriminator) << std::endl;
	});
	
	bot.on_resumed([](const dpp::resumed_t& event) {
		std::cout << "[Shard " << event.shard_id << " -> WebSocket]" << " Successfully resumed previous session." << std::endl; 
	});
	
	bot.on_message_create([&chat](const dpp::message_create_t& event) {
		chat.set_default_headers({
			{ "Authorization", brainbot::Config::ChatRsa },
			{ "Accept", "application/json" }
		});
		
		const httplib::Result data = chat.Post("/chatbot", json_from_string(event.raw_event), "application/json");
		
		if (data)
		{
			if (data->status == HttpStatus::toInt(HttpStatus::Code::OK))
			{
				std::cout << "[Socket -> Post_Chat] message received by chat server." << std::endl;
			}
		}
		else
		{
			std::cout << "[Socket -> Post_Chat] HTTP Error: " << httplib::to_string(data.error()) << std::endl;
		}
	});
	
	bot.on_guild_create([](const dpp::guild_create_t& event) {
		if (event.created->is_unavailable() == 1) return;
		if (Expected_Guilds.find(std::to_string(event.created->id)) != Expected_Guilds.end())
		{
			Expected_Guilds.erase(std::to_string(event.created->id));
			check_ready();
			return;
		}
		
		bot.channel_get(brainbot::Utils::join_leave_channel, [&event](const dpp::confirmation_callback_t& res) {
			alert_join_leave(&res, brainbot::Emojis::join + " has been added to **" + event.created->name + "**\n**[" + std::to_string(dpp::get_guild_count()) + "]**");
		});
		
		bot.channels_get(event.created->id, [&event](const dpp::confirmation_callback_t& res) {
			const uint64_t guildId = event.created->id;
			send_hi_message(&res, std::to_string(static_cast<std::uint64_t>(guildId)));
		});
	});
	
	bot.on_guild_delete([](const dpp::guild_delete_t& event) {
		if (event.deleted->is_unavailable() == 1) return;
		
		bot.channel_get(brainbot::Utils::join_leave_channel, [&event](const dpp::confirmation_callback_t& res) {
			alert_join_leave(&res, brainbot::Emojis::leave + " has been kicked from **" + event.deleted->name + "**\n**[" + std::to_string(dpp::get_guild_count()) + "]**");
		});
	});
	
	bot.start(dpp::st_wait);
}

int main()
{
	handle_discord();
	
	return 0;
}