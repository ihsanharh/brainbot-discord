#include "xtra/alert.h"

void alert_join_leave(const std::string& message)
{
	Brain::BOT->channel_get(Brain::Env("JOIN_LEAVE_CHANNEL"), [message](const dpp::confirmation_callback_t& res) {
		if (res.is_error())
		{
			// if error
			spdlog::error("[Func alert_join_leave] {}", res.get_error().message);
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

void send_hi_message(dpp::guild* guild)
{
	const std::string guildId = std::to_string(guild->id); // this guild id as string
	
	// fetch brainbot guild member object in this guild, we need it to calculate permissions
	Brain::BOT->guild_get_member(guild->id, Brain::BOT->me.id, [guild, guildId](const dpp::confirmation_callback_t& meas_guild_member) {
		dpp::guild_member me_member = std::get<dpp::guild_member>(meas_guild_member.value); // extract the guild_member from the variant
		
		// get all available channels in this guild and capture the me_member from the callback lambda
		Brain::BOT->request("https://discord.com/api/v10/guilds/"+guildId+"/channels", dpp::http_method::m_get, [guild, guildId, me_member](const dpp::http_request_completion_t& res) {
			if (res.status == HttpStatus::toInt(HttpStatus::Code::OK)) // make sure its status code is 200 OK
			{
				nlohmann::json channel_list = nlohmann::json::parse(res.body); // parse the channels to array
				nlohmann::json text_channels; // container to hold text channels
				
				// filter for text channels only and check if the bot has the required permission in that channel 
				// to send the greetings.
				std::copy_if(channel_list.begin(), channel_list.end(), std::back_inserter(text_channels), [guild, me_member](nlohmann::json& channel) {
					dpp::channel ThisChannel;
					// construct one dpp::channel object to hold the channel because the permission_overwrites only accept dpp::channel as the third parameter and the one in this container is nlohmann::json
					
					// check for the bot perms in this channel including overwrites
					uint64_t perms_in_this_channel = guild->permission_overwrites(me_member, ThisChannel.fill_from_json(&channel));
					bool is_granted = ((perms_in_this_channel & dpp::permissions::p_view_channel) == dpp::permissions::p_view_channel) && ((perms_in_this_channel & dpp::permissions::p_send_messages) == dpp::permissions::p_send_messages);
					
					// if its type 0(TEXT CHANNEL) and have the required permissions then continue
					return channel["type"] == 0 && is_granted;
				});
				
				// if the filtered channel map size is equal to or greater than 1 then continue, otherwise don't do anything 
				if (text_channels.size() >= 1)
				{
					// get the first text channel in the filtered map
					nlohmann::json first_channel_in_guild = text_channels[0];
					
					// here we're checking if the bot ever added to this server before or not by
					// doing a GET request to the api server to get the guild data from the database
					Brain::BOT->request(Brain::Env("SERVER_URL")+"/v1/database/chat/"+guildId, dpp::http_method::m_get, [guildId, first_channel_in_guild](const dpp::http_request_completion_t& res) {
						// declare empty string to hold the message later
						std::string content = "";
						
						// if the guild data exist in the database modify message
						if (res.status == HttpStatus::toInt(HttpStatus::Code::OK))
						{
							const nlohmann::json json_guild_data = nlohmann::json::parse(res.body); // parse the guild data returned from the api
							content = Constants::Message::AddedBack;
							
							// if the chat bot channel in database for this guild is not set then assign setup message
							if (json_guild_data["d"]["channel"].is_null()) content += Constants::Message::SetupFirstTime;
							else
							{
								std::string ContinueTalking = Constants::Message::ContinueTalking;
								const std::string& stored_channel_id = json_guild_data["d"]["channel"]; // extract the channel
								
								// check if the stored channel is still exist on discord
								httplib::SSLClient discord_Api("discord.com");
								httplib::Result is_stored_channel_exist = discord_Api.Get("/api/v10/channels/"+stored_channel_id, {
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
						Brain::BOT->global_commands_get([first_channel_in_guild, content](const dpp::confirmation_callback_t& res) {
							if (res.is_error())
							{
								const dpp::error_info full_err = res.get_error();
								spdlog::warn("{}", full_err.message);
								return;
							}
							
							std::string original_content = content;
							
							// replace the command key with the actual command id, so it will be a clickable slash command by looping through slashcommand_map returned from res object in this scope
							for (std::pair<dpp::snowflake, dpp::slashcommand> slash_command : std::get<dpp::slashcommand_map>(res.value))
							{
								std::string key = "</"+slash_command.second.name+">";
								
								// look for command name with format <name</name>> and replace the </name> part with its corresponding command id
								if (original_content.find(key) != std::string::npos) original_content.replace(original_content.find(key), key.size(), std::to_string(slash_command.first));
							}
							
							const dpp::message& hi_message = dpp::message(std::stoull((std::string)first_channel_in_guild["id"]), original_content);
							Brain::BOT->message_create(hi_message);
						});
					}, "", "application/json", {
						{ "Accept", "application/json" },
						{ "Authorization", Brain::Env("SERVER_RSA") }
					});
				}
			} else {
				spdlog::warn("[Func send_hi_message] {}", res.body);
			}
		}, "", "application/json", {
			{ "Accept", "application/json" },
			{ "Authorization", "Bot "+Brain::Env("BRAIN_BOTD_TOKEN") }
		});
	});
}

uint64_t get_guild_count()
{
	uint64_t count = 0;
	
	//get the available shards
	const dpp::shard_list &shard_list = Brain::BOT->get_shards();
	
	// iterate through the shards
	for (const std::pair<uint32_t, dpp::discord_client*> shard : shard_list)
	{
		uint64_t this_shard_guild_count = shard.second->get_guild_count();
		count += this_shard_guild_count;
		
		std::string key = "shard_"+std::to_string(shard.first)+":guild_count";
		Brain::REDIS->set(key, std::to_string(this_shard_guild_count));
	}
	
	return count;
}