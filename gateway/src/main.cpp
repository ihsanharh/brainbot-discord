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
#include <vector>

// bot variables for discord connection
const std::string BotToken = brainbot::Config::Token;
uint32_t enabled_intents = brainbot::Config::Enabled_GatewayIntents;
uint32_t shards_count = brainbot::Config::Shard_Count;

/* this expected_guild map used to store unavailable guild temporarily 
 * when the bot make first connection to discord*/
std::unordered_map<std::string, bool> Expected_Guilds;

// initialize discord client and discord_Api httplib
dpp::cluster bot(BotToken, enabled_intents, shards_count);
httplib::Client discord_Api("https://discord.com");

// used to stringify string from dpp raw event
std::string json_from_string(std::string raw_str)
{
	nlohmann::json j = nlohmann::json::parse(raw_str); /* parse the string into json */
	
	return j.dump(); // dump the json
}

// check the guilds availability
void check_ready()
{
	if (Expected_Guilds.empty())
	{ // if the expected guilds map empty clear it to free memory
		std::cout << "[Expected_Guilds] " << "No more guilds to wait." << std::endl;
		Expected_Guilds.clear();
	}
	else
	{ // don't do anything if the guild still unavailable
		std::cout << "[Expected_Guilds] " << std::to_string(Expected_Guilds.size()) << " remaining guilds to wait." << std::endl;
	}
}

// send log message to support server when the bot gets added to or kicked from a server
void alert_join_leave(const dpp::confirmation_callback_t* res, std::string message)
{
	if (res->is_error())
	{ // if error
		std::cout << res->get_error().message << std::endl;
	}
	else
	{
		const dpp::channel log_channel = std::get<dpp::channel>(res->value);
		dpp::permission log_channel_permissions = log_channel.get_user_permissions(&bot.me);
		
		// check bot permission in log channel
		if (bool checklog_channel_permissions = log_channel_permissions.has(dpp::p_view_channel, dpp::p_send_messages))
		{
			const dpp::message& log_message = dpp::message(log_channel.id, message);
			bot.message_create(log_message); // send the message	
		}
	}
}

// say hi and thanks message to the new server
void send_hi_message(const dpp::confirmation_callback_t* res, const std::string guildId)
{
	if (res->is_error())
	{ // error
		std::cout << res->get_error().message << std::endl;
	}
	else
	{
		std::unordered_map<dpp::snowflake, dpp::channel> channel_list = std::get<std::unordered_map<dpp::snowflake, dpp::channel>>(res->value);
		std::unordered_map<dpp::snowflake, dpp::channel>::iterator it = channel_list.begin();
		
		// filter the channel list to text only
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
		
		// if there's text channel equal to or greater than 1 then continue otherwise don't do anything 
		if (channel_list.size() >= 1)
		{
			// get the first text channel in the filtered list
			const dpp::channel first_channel_in_guild = channel_list.begin()->second;
			std::string path = "/database/guild/"+guildId;
			
			/* here we're checking if the bot ever added to this server before or not by
			 * doing a get request to api server to get the guild data in bot database*/
			bot.request((std::string)brainbot::Utils::server_url+path, dpp::http_method::m_get, [first_channel_in_guild](const dpp::http_request_completion_t& res) {
				std::string content = "";
				
				if (res.status == HttpStatus::toInt(HttpStatus::Code::OK))
				{ // if there's data in bot database for this guild
					const nlohmann::json json_guild_data = nlohmann::json::parse(res.body);
					content = brainbot::Message::AddedBack;
					
					// if the chat bot channel in database for this guild is not set then assign setup message
					if (json_guild_data["channel"].is_null()) content += brainbot::Message::SetupFirstTime;
					else
					{ // if there's chat bot channel stored assign continue talking message 
						std::string ContinueTalking = brainbot::Message::ContinueTalking;
						const std::string& stored_channel_id = json_guild_data["channel"]; // extract the channel
						
						// check if the stored channel is still exist on discord
						httplib::Result is_stored_channel_exist = discord_Api.Get((std::string)"/api/v10/channels/"+stored_channel_id, {
							{ "Accept", "application/json" },
							{ "Authorization", "Bot "+BotToken }
						});
						
						// if the channel exist assign continue talking otherwise assign setup message
						if (is_stored_channel_exist && is_stored_channel_exist->status == HttpStatus::toInt(HttpStatus::Code::OK)) content += ContinueTalking.replace(ContinueTalking.find("<#cid>"), std::string("<#cid>").size(), stored_channel_id);
						else content += brainbot::Message::SetupFirstTime;
					}
				}
				else
				{ // if guild data is not found for this guild rewrite the message with first message and setup message
					content = brainbot::Message::FirstTime+brainbot::Message::SetupFirstTime;
				}
				
				/* after modifying the content we do another get request to api server,
				 * getting bot commands to modify the key in content so the application command is clickable on discord*/
				bot.request((std::string)brainbot::Utils::server_url+"/_commands", dpp::http_method::m_get, [first_channel_in_guild, content](const dpp::http_request_completion_t& res) {
					std::string original_content = content;
					const nlohmann::json json_commands = nlohmann::json::parse(res.body); // parse the commands returned from api server
					
					// replace the command key with the actual command id, so it will be a clickable slash command
					for (int i = 0; i < json_commands.size(); ++i)
					{
						std::string key = "</"+json_commands[i]["name"].get<std::string>()+">";
						if (original_content.find(key) != std::string::npos) original_content.replace(original_content.find(key), key.size(), json_commands[i]["id"].get<std::string>());
					}
					
					const dpp::message& hi_message = dpp::message(first_channel_in_guild.id, original_content);
					bot.message_create(hi_message);
				}, "", "application/json", {
					{ "Accept", "application/json" },
					{ "Authorization", brainbot::Config::ServerRsa }
				});
			}, "", "application/json", {
				{ "Accept", "application/json" },
				{ "Authorization", brainbot::Config::ServerRsa }
			});
		}
	}
}

// to set the initial message in collectors
void _collectorAck(const dpp::message_create_t& event)
{
	const nlohmann::json json_event = nlohmann::json::parse(json_from_string(event.raw_event));
	
	bot.request((std::string)brainbot::Utils::server_url+"/_collector/_active", dpp::http_method::m_get, [json_event](const dpp::http_request_completion_t& res) {
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
					std::string get_state = mixed_state.substr(last_i+1);
					
					if (std::find(active_collector.begin(), active_collector.end(), get_state) != active_collector.end())
					{
						nlohmann::json payload = {
							{ "state", get_state },
							{ "message", json_message.dump() }
						};
						
						bot.request((std::string)brainbot::Utils::server_url+"/_collector/message", dpp::http_method::m_post, [](const dpp::http_request_completion_t& res) {}, payload.dump(), "application/json", {
							{ "Authorization", brainbot::Config::ServerRsa },
							{ "Content-Type", "application/json;charset=utf-8" }
						});
						break;
					}
				}
			}
		}
	}, "", "application/json", {
		{ "Accept", "application/json"},
		{ "Authorization", brainbot::Config::ServerRsa }
	});
}

// start handling discord 
void handle_discord()
{
	bot.on_ready([](const dpp::ready_t& event) {
		nlohmann::json raw_event = nlohmann::json::parse(json_from_string(event.raw_event));
		for (auto& i : raw_event["d"]["guilds"])
		{
			// if the guild's unavailable set to unexpected guilds
			Expected_Guilds.insert({i["id"], true});
		}
		
		std::cout << "[Shard " << event.shard_id << " -> WebSocket]" << " Connected to Discord as " << bot.me.username << "#" << std::to_string(bot.me.discriminator) << std::endl;
	});
	
	bot.on_resumed([](const dpp::resumed_t& event) {
		std::cout << "[Shard " << event.shard_id << " -> WebSocket]" << " Successfully resumed previous session." << std::endl; 
	});
	
	bot.on_message_create([](const dpp::message_create_t& event) {
		if ((event.msg.type == dpp::message_type::mt_application_command) == 1 && event.msg.author.id == bot.me.id) _collectorAck(event); // send to collector ack
		
		// send all messages to chat server
		bot.request(brainbot::Utils::chatter_url, dpp::http_method::m_post, [](const dpp::http_request_completion_t& res) {}, json_from_string(event.raw_event), "application/json", {
			{ "Authorization", brainbot::Config::ChatRsa },
			{ "Content-Type", "application/json" }
		});
	});
	
	bot.on_guild_create([](const dpp::guild_create_t& event) {
		nlohmann::json raw_event = nlohmann::json::parse(event.raw_event);
		nlohmann::json raw_created_guild = raw_event["d"].get<nlohmann::json>();
		
		bot.request((std::string)brainbot::Utils::server_url+"/_guild/create", dpp::http_method::m_post, [](const dpp::http_request_completion_t& res) {}, raw_created_guild.dump(), "application/json", {
			{ "Authorization", brainbot::Config::ServerRsa },
			{ "Content-Type", "application/json" }
		});
		
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
		nlohmann::json raw_event = nlohmann::json::parse(event.raw_event);
		nlohmann::json raw_deleted_guild = raw_event["d"].get<nlohmann::json>();
		
		bot.request((std::string)brainbot::Utils::server_url+"/_guild/delete", dpp::http_method::m_post, [](const dpp::http_request_completion_t& res) {}, raw_deleted_guild.dump(), "application/json", {
			{ "Authorization", brainbot::Config::ServerRsa },
			{ "Content-Type", "application/json" }
		});
			
		if (event.deleted->is_unavailable() == 1) return;
		
		bot.channel_get(brainbot::Utils::join_leave_channel, [&event](const dpp::confirmation_callback_t& res) {
			alert_join_leave(&res, brainbot::Emojis::leave + " has been kicked from **" + event.deleted->name + "**\n**[" + std::to_string(dpp::get_guild_count()) + "]**");
		});
	});
	
	bot.start(dpp::st_wait);
}

int main()
{ /// start handling discord gateway
	handle_discord();
	
	return 0;
}