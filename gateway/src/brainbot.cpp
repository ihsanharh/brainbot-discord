/* SSL support for httplib.h */
#define CPPHTTPLIB_OPENSSL_SUPPORT

#include "libs/HttpStatusCodes_C++11.h" // HttpStatus
#include "libs/brainbot.h" // brainbot
#include "libs/httplib.h" // httplib
#include "libs/nlohmann/json.hpp" // nlohmann

#include <dpp/dpp.h> // dpp
#include <algorithm> // copy_if find
#include <chrono> // chrono
#include <cstdlib> // getenv
#include <iterator> // back_inserter
#include <iostream> // cout endl get
#include <string> // string to_string stoull
#include <thread> // thread
#include <unordered_map> // unordered_map
#include <vector> // vector

// bot variables for discord connection
int app_state;
std::chrono::time_point<std::chrono::system_clock> expected_guilds_out;

const std::string BotToken = brainbot::Config::Token;
uint32_t enabled_intents = brainbot::Config::Enabled_GatewayIntents;
uint32_t shards_count = brainbot::Config::Shard_Count;

/* this expected_guild map used to store unavailable guild temporarily 
 * when the bot make first connection to discord*/
std::unordered_map<std::string, bool> Expected_Guilds;

// initialize discord client and discord_Api httplib
dpp::cluster bot(BotToken, enabled_intents, shards_count);
httplib::Client discord_Api("https://discord.com");

// check the guilds availability
void check_ready()
{
	std::chrono::time_point<std::chrono::system_clock> out_now = std::chrono::system_clock::now();
	std::chrono::duration is_thirty_seconds = std::chrono::duration_cast<std::chrono::milliseconds>(out_now - expected_guilds_out);
	
	if (Expected_Guilds.empty())
	{ // if the expected guilds map empty clear it to free memory
		Expected_Guilds.clear();
		app_state = 1; // 1: Brain Bot is fully ready.
		std::cout << "[Var Expected_Guilds] All guilds is now available." << std::endl;
	} else if (is_thirty_seconds.count() >= 30000)
	{
		app_state = 2; // 2: Brain Bot is ready while there's unavailable guilds.
		std::cout << "[Var Expected_Guilds] There are " << Expected_Guilds.size() << " unavailable guilds." << std::endl;
	}
}

void post_chat(nlohmann::json& message)
{
	httplib::Client chat_server(brainbot::Utils::chatter_url);
	httplib::Headers req_headers = {
		{ "Authorization", brainbot::Config::ChatRsa }
	};
	
	chat_server.Post("/_mafi", req_headers, message.dump(), "application/json");
}

// send log message to support server when the bot gets added to or kicked from a server
void alert_join_leave(const std::string& message)
{
	bot.channel_get(brainbot::Utils::join_leave_channel, [message](const dpp::confirmation_callback_t& res) {
		if (res.is_error())
		{
			// if error
			std::cout << "[Func alert_join_leave] error: " << res.get_error().message << std::endl;
		}
		else
		{
			const dpp::channel log_channel = std::get<dpp::channel>(res.value);
			dpp::permission log_channel_permissions = log_channel.get_user_permissions(&bot.me);
			std::string original_message = message;
			// check bot permission in log channel
			if (bool checklog_channel_permissions = log_channel_permissions.has(dpp::p_view_channel, dpp::p_send_messages))
			{
				const dpp::message& log_message = dpp::message(log_channel.id, original_message);
				bot.message_create(log_message); // send the message	
			}
		}
	});
}

// say hi and thanks message to the new server
void send_hi_message(const std::string& guildId)
{
	bot.request(static_cast<std::string>(brainbot::Utils::server_url)+"/_guild/"+static_cast<std::string>(guildId)+"/channels?permissionsfor="+std::to_string(bot.me.id), dpp::http_method::m_get, [guildId](const dpp::http_request_completion_t& res) {
		if (res.status == HttpStatus::toInt(HttpStatus::Code::OK))
		{
			nlohmann::json channel_list = nlohmann::json::parse(res.body);
			nlohmann::json text_channels;
			std::copy_if(channel_list.begin(), channel_list.end(), std::back_inserter(text_channels), [](const nlohmann::json& channel) {
				uint64_t perms_in_this_channel = std::stoull((std::string)channel["req_user_permissions"]["allow"]);
				bool is_granted = ((perms_in_this_channel & dpp::permissions::p_view_channel) == dpp::permissions::p_view_channel) && ((perms_in_this_channel & dpp::permissions::p_send_messages) == dpp::permissions::p_send_messages);
				
				return channel["type"] == 0 && is_granted;
			});
			// if there's text channel equal to or greater than 1 then continue otherwise don't do anything 
			if (text_channels.size() >= 1)
			{
				// get the first text channel in the filtered list
				nlohmann::json first_channel_in_guild = text_channels[0];
				// here we're checking if the bot ever added to this server before or not by
				// doing a get request to api server to get the guild data in bot database
				bot.request(static_cast<std::string>(brainbot::Utils::server_url)+"/database/guild/"+guildId, dpp::http_method::m_get, [first_channel_in_guild](const dpp::http_request_completion_t& res) {
					std::string content = "";
					
					if (res.status == HttpStatus::toInt(HttpStatus::Code::OK))
					{
						const nlohmann::json json_guild_data = nlohmann::json::parse(res.body);
						content = brainbot::Message::AddedBack;
						// if the chat bot channel in database for this guild is not set then assign setup message
						if (json_guild_data["channel"].is_null()) content += brainbot::Message::SetupFirstTime;
						else
						{
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
					{
						// if guild data is not found for this guild rewrite the message with first message and setup message
						content = brainbot::Message::FirstTime+brainbot::Message::SetupFirstTime;
					}
					
					// after modifying the content we do another get request to api server,
					// getting bot commands to modify the key in content so the application command is clickable on discord
					bot.request((std::string)brainbot::Utils::server_url+"/_commands", dpp::http_method::m_get, [first_channel_in_guild, content](const dpp::http_request_completion_t& res) {
						std::string original_content = content;
						const nlohmann::json json_commands = nlohmann::json::parse(res.body); // parse the commands returned from api server
						// replace the command key with the actual command id, so it will be a clickable slash command
						for (int i = 0; i < json_commands.size(); ++i)
						{
							std::string key = "</"+json_commands[i]["name"].get<std::string>()+">";
							if (original_content.find(key) != std::string::npos) original_content.replace(original_content.find(key), key.size(), json_commands[i]["id"].get<std::string>());
						}
						
						const dpp::message& hi_message = dpp::message(std::stoull((std::string)first_channel_in_guild["id"]), original_content);
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
	}, "", "application/json", {
		{ "Accept", "application/json" },
		{ "Authorization", brainbot::Config::ServerRsa }
	});
}

// to set the initial message in collectors
void _collectorAck(const dpp::message_create_t& event)
{
	const nlohmann::json json_event = nlohmann::json::parse(event.raw_event);
	
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
void init_bot()
{
	bot.on_ready([](const dpp::ready_t& event) {
		nlohmann::json raw_event = nlohmann::json::parse(event.raw_event);
		app_state = 0;
		
		for (auto& i : raw_event["d"]["guilds"])
		{
			// set unavailable guild to unexpected guilds
			Expected_Guilds.insert({i["id"], true});
		}
		
		std::cout << "[Event READY] Shard " << event.shard_id << " Connected to Discord as " << bot.me.username << "#" << bot.me.discriminator << std::endl;
	});
	
	bot.on_resumed([](const dpp::resumed_t& event) {
		std::cout << "[Event RESUMED] Shard " << event.shard_id << " Resumed previous session." << std::endl; 
	});
	
	bot.on_message_create([](const dpp::message_create_t& event) {
		nlohmann::json raw_message = nlohmann::json::parse(event.raw_event);
		
		post_chat(raw_message);
		
		if ((event.msg.type == dpp::message_type::mt_application_command) == 1 && event.msg.author.id == bot.me.id) _collectorAck(event); // send to collector ack
	});
	
	bot.on_guild_create([](const dpp::guild_create_t& event) {
		nlohmann::json raw_event = nlohmann::json::parse(event.raw_event);
		nlohmann::json raw_created_guild = raw_event["d"].get<nlohmann::json>();
		nlohmann::json create_payload = {
			{ "id", (std::string)std::to_string(event.created->id) },
			{ "shard_id", (std::string)std::to_string(event.created->shard_id) },
			{ "guild", raw_created_guild.dump() }
		};
		
		bot.request((std::string)brainbot::Utils::server_url+"/_guild/create", dpp::http_method::m_post, [](const dpp::http_request_completion_t& res) {
			if (res.status != HttpStatus::toInt(HttpStatus::Code::OK)) std::cout << "[Event GUILD_CREATE] Failed to do POST request with status code: " << res.status << "\n" << res.body << std::endl;
		}, create_payload.dump(), "application/json", {
			{ "Authorization", brainbot::Config::ServerRsa },
			{ "Content-Type", "application/json" }
		});
		
		if (event.created->is_unavailable() == 1) return;
		if (app_state == 0 && Expected_Guilds.find(std::to_string(event.created->id)) != Expected_Guilds.end())
		{
			expected_guilds_out = std::chrono::system_clock::now();
			Expected_Guilds.erase(std::to_string(event.created->id));
			
			std::thread t([]() {
				std::this_thread::sleep_for(std::chrono::milliseconds(30000));
				check_ready();
			});
			t.detach();
			
			return;
		}
		
		send_hi_message(std::to_string(event.created->id));
		alert_join_leave((std::string)brainbot::Emojis::join + " has been added to **" + (std::string)event.created->name + "**\n**[" + (std::string)std::to_string(dpp::get_guild_count()) + "]**");
	});
	
	bot.on_guild_delete([](const dpp::guild_delete_t& event) {
		if (event.deleted->is_unavailable() == 1)
		{
			if (app_state == 2 && Expected_Guilds.find(std::to_string(event.deleted->id)) != Expected_Guilds.end())
			{
				std::cout << "[Event GUILD_DELETE] Kicked from unavailable guild." << std::endl;
				Expected_Guilds.erase(std::to_string(event.deleted->id));
				check_ready();
			}
			
			return;
		}
		
		nlohmann::json delete_payload = {
			{ "id", (std::string)std::to_string(event.deleted->id) }
		};
		
		bot.request((std::string)brainbot::Utils::server_url+"/_guild/delete", dpp::http_method::m_delete, [](const dpp::http_request_completion_t& res) {
			if (res.status != HttpStatus::toInt(HttpStatus::Code::OK)) std::cout << "[Event GUILD_DELETE] Failed to do DELETE request with status code: " << res.status << "\n" << res.body << std::endl;
		}, delete_payload.dump(), "application/json", {
			{ "Authorization", brainbot::Config::ServerRsa },
			{ "Content-Type", "application/json" }
		});
		
		alert_join_leave((std::string)brainbot::Emojis::leave + " have been kicked from **" + (std::string)event.deleted->name + "**\n**[" + (std::string)std::to_string(dpp::get_guild_count()) + "]**");
	});
	
	bot.start(dpp::st_wait);
}