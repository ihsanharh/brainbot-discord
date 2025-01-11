#include "xtra/alert.h"
#include "mongo.h"

#include <bsoncxx/stdx/optional.hpp>  // bsoncxx::stdx::optional

void alert_join_leave(const std::string& message)
{
	SPDLOG_TRACE("Alerting join/leave");
	Brain::BOT->guild_get_member(Brain::Env("MAIN_SERVER_ID"), Brain::BOT->me.id, [message](const dpp::confirmation_callback_t& res) {
		dpp::guild_member me_member = std::get<dpp::guild_member>(res.value);

		Brain::BOT->channel_get(Brain::Env("JOIN_LEAVE_CHANNEL"), [message, me_member](const dpp::confirmation_callback_t& res) {
			if (res.is_error())
			{
				// if error
				spdlog::error("[Func alert_join_leave] {}", res.get_error().message);
				return;
			}
			
			const dpp::channel log_channel = std::get<dpp::channel>(res.value);
			dpp::permission log_channel_permissions = log_channel.get_user_permissions(me_member);
			bool checklog_channel_permissions = log_channel_permissions.has(dpp::p_view_channel, dpp::p_send_messages);
			
			// check bot permission in log channel
			if (checklog_channel_permissions)
			{
				const dpp::message& log_message = dpp::message(log_channel.id, message);
				Brain::BOT->message_create(log_message); // send the message	
			}
		});
	});
}

void send_hi_message(dpp::guild* guild)
{
	const std::string guildId = std::to_string(guild->id); // this guild id as string
	
	// fetch brainbot guild member object in this guild, we need it to calculate permissions
	Brain::BOT->guild_get_member(guild->id, Brain::BOT->me.id, [guild, guildId](const dpp::confirmation_callback_t& meas_guild_member) {
		dpp::guild_member me_member = std::get<dpp::guild_member>(meas_guild_member.value);
		
		// get all available channels in this guild
		Brain::BOT->request("https://discord.com/api/v10/guilds/"+guildId+"/channels", dpp::http_method::m_get, [guild, guildId, me_member](const dpp::http_request_completion_t& res) {
			if (res.status != HttpStatus::toInt(HttpStatus::Code::OK))
			{
				spdlog::warn("[Func send_hi_message] {}", res.body);
			}

			nlohmann::json channel_list = nlohmann::json::parse(res.body);
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
			
			if (text_channels.size() < 1) return;

			nlohmann::json first_channel_in_guild = text_channels[0];
			std::string guild_id = guildId;
			mongocxx::collection chat_collections = Brain::MONGO->database(Brain::Env("DATABASE_NAME")).collection("chats");
			bsoncxx::stdx::optional<bsoncxx::document::value> guild_data = chat_collections.find_one(bsoncxx::builder::basic::make_document(bsoncxx::builder::basic::kvp("_id", guild_id)));
			
			// default hi message, never been added to this server
			std::string hi_message = Constants::Message::FirstTime + Constants::Message::SetupFirstTime;

			if (guild_data)
			{
				hi_message = Constants::Message::AddedBack + Constants::Message::SetupFirstTime;

				if (guild_data->view()["channel"].type() == bsoncxx::type::k_string)
				{
					std::string ContinueTalking = Constants::Message::ContinueTalking;
					const std::string stored_channel_id{guild_data->view()["channel"].get_string().value};

					httplib::SSLClient discord_api("discord.com");
					httplib::Result channel_exist = discord_api.Get("/api/v10/channels/" + stored_channel_id, {
						{ "Accept", "application/json" },
						{ "Authorization", "Bot " + Brain::Env("BRAIN_BOTD_TOKEN") }
					});

					if (channel_exist && channel_exist->status == HttpStatus::toInt(HttpStatus::Code::OK)) hi_message = Constants::Message::AddedBack + ContinueTalking.replace(ContinueTalking.find("<#cid>"), std::string("<#cid>").size(), stored_channel_id);
				}
			}
			
			// getting bot commands to modify the command key in hi_message so the application command is clickable on discord
			Brain::BOT->global_commands_get([first_channel_in_guild, hi_message](const dpp::confirmation_callback_t& res) {
				if (res.is_error())
				{
					const dpp::error_info full_err = res.get_error();
					spdlog::warn("{}", full_err.message);
					return;
				}
				
				std::string original_content = hi_message;
				
				// replace the command key with the actual command id, so it will be a clickable slash command by looping through slashcommand_map returned from res object in this scope
				for (std::pair<dpp::snowflake, dpp::slashcommand> slash_command : std::get<dpp::slashcommand_map>(res.value))
				{
					std::string key = "</"+slash_command.second.name+">";
					
					// look for command name with format <name</name>> and replace the </name> part with its corresponding command id
					if (original_content.find(key) != std::string::npos) original_content.replace(original_content.find(key), key.size(), std::to_string(slash_command.first));
				}
				
				const dpp::message& his_message = dpp::message(std::stoull((std::string)first_channel_in_guild["id"]), original_content);
				Brain::BOT->message_create(his_message);
			});
		}, "", "application/json", {
			{ "Accept", "application/json" },
			{ "Authorization", "Bot " + Brain::Env("BRAIN_BOTD_TOKEN") }
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