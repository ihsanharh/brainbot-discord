#include "xtra/alert.h"

void alert_join_leave(const std::string& message)
{
	Brain::BOT->channel_get(Brain::Env("JOIN_LEAVE_CHANNEL"), [message](const dpp::confirmation_callback_t& res) {
		if (res.is_error())
		{
			// if error
			std::cout << "(Func alert_join_leave) error: " << res.get_error().message << std::endl;
		}
		else
		{
			const dpp::channel log_channel = std::get<dpp::channel>(res.value);
			dpp::permission log_channel_permissions = log_channel.get_user_permissions(&Brain::BOT->me);
			std::string original_message = message;
			// check bot permission in log channel
			if (bool checklog_channel_permissions = log_channel_permissions.has(dpp::p_view_channel, dpp::p_send_messages))
			{
				const dpp::message& log_message = dpp::message(log_channel.id, original_message);
				Brain::BOT->message_create(log_message); // send the message	
			}
		}
	});
}

void send_hi_message(const std::string& guildId)
{
	Brain::BOT->request(Brain::Env("SERVER_URL")+"/_guild/"+static_cast<std::string>(guildId)+"/channels?permissionsfor="+std::to_string(Brain::BOT->me.id), dpp::http_method::m_get, [guildId](const dpp::http_request_completion_t& res) {
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
				Brain::BOT->request(Brain::Env("SERVER_URL")+"/database/guild/"+guildId, dpp::http_method::m_get, [first_channel_in_guild](const dpp::http_request_completion_t& res) {
					std::string content = "";
					
					if (res.status == HttpStatus::toInt(HttpStatus::Code::OK))
					{
						const nlohmann::json json_guild_data = nlohmann::json::parse(res.body);
						content = Constants::Message::AddedBack;
						// if the chat bot channel in database for this guild is not set then assign setup message
						if (json_guild_data["channel"].is_null()) content += Constants::Message::SetupFirstTime;
						else
						{
							std::string ContinueTalking = Constants::Message::ContinueTalking;
							const std::string& stored_channel_id = json_guild_data["channel"]; // extract the channel
							// check if the stored channel is still exist on discord
							httplib::Client discord_Api("https://discord.com");
							httplib::Result is_stored_channel_exist = discord_Api.Get((std::string)"/api/v10/channels/"+stored_channel_id, {
								{ "Accept", "application/json" },
								{ "Authorization", "Bot "+Brain::Env("BRAIN_BOTD_TOKEN") }
							});
							// if the channel exist assign continue talking otherwise assign setup message
							if (is_stored_channel_exist && is_stored_channel_exist->status == HttpStatus::toInt(HttpStatus::Code::OK)) content += ContinueTalking.replace(ContinueTalking.find("<#cid>"), std::string("<#cid>").size(), stored_channel_id);
							else content += Constants::Message::SetupFirstTime;
						}
					}
					else
					{
						// if guild data is not found for this guild rewrite the message with first message and setup message
						content = Constants::Message::FirstTime + Constants::Message::SetupFirstTime;
					}
					
					// after modifying the content we do another get request to api server,
					// getting bot commands to modify the key in content so the application command is clickable on discord
					Brain::BOT->request(Brain::Env("SERVER_URL")+"/_commands", dpp::http_method::m_get, [first_channel_in_guild, content](const dpp::http_request_completion_t& res) {
						std::string original_content = content;
						const nlohmann::json json_commands = nlohmann::json::parse(res.body); // parse the commands returned from api server
						// replace the command key with the actual command id, so it will be a clickable slash command
						for (int i = 0; i < json_commands.size(); ++i)
						{
							std::string key = "</"+json_commands[i]["name"].get<std::string>()+">";
							if (original_content.find(key) != std::string::npos) original_content.replace(original_content.find(key), key.size(), json_commands[i]["id"].get<std::string>());
						}
						
						const dpp::message& hi_message = dpp::message(std::stoull((std::string)first_channel_in_guild["id"]), original_content);
						Brain::BOT->message_create(hi_message);
					}, "", "application/json", {
						{ "Accept", "application/json" },
						{ "Authorization", Brain::Env("SERVER_RSA") }
					});
				}, "", "application/json", {
					{ "Accept", "application/json" },
					{ "Authorization", Brain::Env("SERVER_RSA") }
				});
			}
		}
	}, "", "application/json", {
		{ "Accept", "application/json" },
		{ "Authorization", Brain::Env("SERVER_RSA") }
	});
}

std::string getGuildsCount()
{
	httplib::Client Server(Brain::Env("SERVER_URL"));
	httplib::Result res = Server.Get("/_guild/count", {
		{"Authorization", Brain::Env("SERVER_RSA")}
	});
	
	if (res && res->status == HttpStatus::toInt(HttpStatus::Code::OK))
	{
		nlohmann::json body = nlohmann::json::parse(res->body);
		
		return body["count"];
	}
	else
	{
		std::cout << httplib::to_string(res.error()) << std::endl;
		return "0";
	}
}