#include "chatter.h"
#include "dbhelper.h"
#include "mongo.h"

#include <bsoncxx/stdx/optional.hpp> // bsoncxx::stdx::optional
#include <bsoncxx/json.hpp> // bsoncxx::to_json()

/**
 * return the obtained proxy to redis
 */
void return_proxy(const std::string &proxy_id)
{
	std::optional<std::string> proxy = Brain::REDIS->hget("proxy_u", proxy_id);
	
	if (!proxy) return;
	
	Brain::REDIS->hset("proxy", proxy_id, *proxy);
}

/**
 * incase something fail, like the proxy is not active, abort the session
 */
int abort_session(const nlohmann::json &session_obj, uint16_t status)
{
	std::string user_id = session_obj["user_id"].get<std::string>();
	std::string proxy_id = session_obj["proxy_id"].get<std::string>();
	std::optional<std::string> check_session = Brain::REDIS->get("session:" + user_id);
	
	if (status == 0)
	{
		if (!check_session) return_proxy(proxy_id);
		return 1;
	}
	if (check_session) Brain::REDIS->del("session:" + user_id);
	if (status == static_cast<uint16_t>(HttpStatus::Code::Forbidden))
	{
		SPDLOG_TRACE("[@{}] Got 403 Forbidden response from {}", user_id, proxy_id);
		Brain::REDIS->hset("proxy_b", proxy_id, "0");
	}
	else
	{
		return_proxy(proxy_id);
	}

	Brain::REDIS->del("session:" + user_id);
	Brain::REDIS->hdel("proxy_u", proxy_id);
	
	return 1;
}

/**
 * Obtain proxy from redis
 */
std::optional<std::pair<std::string, std::string>> obtain_proxy(std::string conversation_type)
{
	static std::mutex proxymutex;
	std::scoped_lock lock(proxymutex);
	
	std::vector<std::string> available_proxy{};
	long long cursor = 0LL;
	
	while (true)
	{
		cursor = Brain::REDIS->hscan("proxy", cursor, conversation_type + "*", std::back_inserter(available_proxy));
		
		if (cursor == 0) break;
	}
	
	if (available_proxy.empty()) return std::nullopt;
	
	std::string picked_proxy = available_proxy[0];
	std::string picked_proxy_url = available_proxy[1];
	
	Brain::REDIS->hdel("proxy", picked_proxy);
	Brain::REDIS->hset("proxy_u", picked_proxy, picked_proxy_url);
	
	std::pair<std::string, std::string> proxy = std::make_pair<std::string, std::string>(std::move(picked_proxy), std::move(picked_proxy_url));
	
	return std::make_optional(proxy);
}

/**
 * based on Howard Hinnant's answer on stackoverflow, with some modification to return milliseconds. Thanks to him:)
 * https://stackoverflow.com/a/38839725/15351305
 * DPP does not give me the ISO 8601 timestamp from discord, they turn the timestamp into time_t so it lost its milliseconds:(
 */
long long iso_string_to_milliseconds(std::istream&& iso_string)
{
	std::string save;
	iso_string >> save;
	std::istringstream iso_ss{save};
	std::chrono::time_point<std::chrono::system_clock, std::chrono::milliseconds> tp;
  
    iso_ss >> date::parse("%FT%T%z", tp);
  
    if (iso_ss.fail())
    {
		iso_ss.clear();
  	    iso_ss.exceptions(std::ios::failbit);
  	    iso_ss.str(save);
  	    iso_ss >> date::parse("%FT%T%Ez", tp);
    }
  
    return tp.time_since_epoch().count();
}

/**
 * function to compare the message timestamp, used to sort from latest message
 */
bool compare_timestamp(const std::string& a, const std::string& b)
{
	long long timestamp_a = std::stoll(a);
	long long timestamp_b = std::stoll(b);
	
	return timestamp_a > timestamp_b;
};

std::string clean_content(const std::string &str, std::string replace_with, std::string match_with, const std::string &author_id)
{
	std::string cleaned = str;
	
	try
	{
		std::regex rx(match_with);
		
		return std::regex_replace(cleaned, rx, replace_with);
	}
	catch(std::regex_error e)
	{
		SPDLOG_TRACE("[@{}] Regex failed to match: {}\n{}", author_id, str, e.what());
		return cleaned;
	}
}

/**
 * if possible replace every resolvable user mention to their username
 */
std::string clean_mention(const dpp::message &message)
{
	std::string author_id = std::to_string(message.author.id);
	std::string cleaned = message.content;
	
	if (!message.mentions.empty())
	{
		for (std::pair<dpp::user, dpp::guild_member> mention : message.mentions)
		{
			std::string user_id = std::to_string(mention.first.id);
			std::string match_user_mention = "(<@(!?" + user_id + ")>)";
			
			cleaned = clean_content(cleaned, mention.first.username, match_user_mention, author_id);
		}
	}
	
	if (!message.mention_channels.empty())
	{
		for (dpp::channel channel : message.mention_channels)
		{
			std::string channel_id = std::to_string(channel.id);
			std::string match_channel_mention = "(<#" + channel_id + ">)";
			
			cleaned = clean_content(cleaned, channel.name, match_channel_mention, author_id);
		}
	}
	
	if (!message.mention_roles.empty())
	{
		for (dpp::snowflake role_id_r : message.mention_roles)
		{
			std::string role_id = std::to_string(role_id_r);
			std::string match_role_mention = "(<@&" + role_id + ">)";
			
			cleaned = clean_content(cleaned, "role", match_role_mention, author_id);
		}
	}
	
	cleaned = clean_content(cleaned, "Cleverbot", Constants::Regex::Brainbot, author_id);
	
	return cleaned;
}

/**
 * handling user session and conversation
 */
void respond(const dpp::message &message, const std::chrono::time_point<std::chrono::system_clock> start, nlohmann::json raw_message)
{
	std::thread([message, start, raw_message]() {
		std::string channel_id = std::to_string(message.channel_id);
		// store this message id as last message in the channel, used for reference later
		std::optional<std::string> lmi = Brain::REDIS->get("last_message_id:" + channel_id);
		
		if (!lmi) Brain::REDIS->setex("last_message_id:" + channel_id, 5, std::to_string(message.id));
		
		// take ISO 8601 (Discord used ISO 8601 for their timestamp) and convert to milliseconds for easier comparison
		// then store it to redis
		std::string author_id = std::to_string(message.author.id);
		std::string message_timestamp = raw_message["d"]["timestamp"].get<std::string>();
		long long message_creation_time_ms = iso_string_to_milliseconds(std::istringstream{message_timestamp});
		std::optional<std::string> is_cooldown = Brain::REDIS->get("cooldown:" + author_id);
		
		Brain::REDIS->setex("message:" + author_id + ":" + std::to_string(message.id), 6, std::to_string(message_creation_time_ms));
		
		if (is_cooldown)
		{
			SPDLOG_TRACE("[@{}] User is in cooldown", author_id);
			std::vector<std::string> this_user_messages, users_messages_timestamp;
			long long cursor = 0LL;
			
			// retrieve the cached user's message ids from redis
			while (true)
			{
				cursor = Brain::REDIS->scan(cursor, "message:" + author_id + ":*", 10, std::back_inserter(this_user_messages));
				
				if (cursor == 0) break;
			}
			
			// get each message timestamps
			for (std::string& key : this_user_messages)
			{
				std::optional<std::string> get_each_users_message = Brain::REDIS->get(key);
				
				if (get_each_users_message) users_messages_timestamp.push_back(*get_each_users_message);
			}
			
			std::sort(users_messages_timestamp.begin(), users_messages_timestamp.end(), compare_timestamp);
			
			// check for spam, incase the user sent 3 messages under 2.5 seconds then ignore it and warn them
			if (users_messages_timestamp.size() >= 3 && (message_creation_time_ms - std::stoll(users_messages_timestamp[2])) < 2500)
			{
				SPDLOG_TRACE("[@{}] User is spamming", author_id);
				Brain::REDIS->psetex("cooldown:" + author_id, Constants::TTL::MessageCooldown, "chat_cooldown");
				dpp::message raw_spam_message = dpp::message(message.channel_id, "**Warning:** Spamming is forbidden.");
				
				raw_spam_message.set_reference(message.id);
				Brain::BOT->message_create(const_cast<dpp::message&>(raw_spam_message));
			}
			
			return;
		}
		
		Brain::REDIS->psetex("cooldown:" + author_id, Constants::TTL::MessageCooldown, "chat_cooldown");
		DiscordLog::send(message, "", false);
		
		SPDLOG_TRACE("[@{}] Retrieving user session", author_id);
		// handle user session
		std::optional<std::string> get_user_session = Brain::REDIS->get("session:" + author_id);
		nlohmann::json session_obj;
		std::string content = clean_mention(message);
		
		if (get_user_session)
		{
			SPDLOG_TRACE("[@{}] Session found", author_id);
			session_obj = nlohmann::json::parse(*get_user_session);
			session_obj["last_message_timestamp"] = std::to_string(message_creation_time_ms);
			session_obj["content"] = content;
		}
		else
		{
			SPDLOG_TRACE("[@{}] Creating new session", author_id);
			std::string conv_type = message.is_dm()? "pri": "cha";
			std::optional<std::pair<std::string, std::string>> obtained_proxy = obtain_proxy(conv_type);
			
			if (!obtained_proxy)
			{
				SPDLOG_TRACE("[@{}] No proxy available, aborting..", author_id);
				return;
			}

			std::string line = obtained_proxy.value().second;
			std::string::size_type pos_t = line.find("$");
			std::string url = line.substr(0, pos_t);
			std::string agent = line.substr(pos_t + 1);
			
			SPDLOG_TRACE("[@{}] Using proxy {}", author_id, url);

			session_obj = {
				{"user_id", author_id},
				{"useragent", agent},
				{"proxy_id", obtained_proxy.value().first},
				{"proxy", url},
				{"content", content},
				{"where", message.is_dm()? "DM": "GUILD"},
				{"guild_id", message.is_dm()? "0": std::to_string(message.guild_id)},
				{"last_message_timestamp", std::to_string(message_creation_time_ms)},
				{"context", nlohmann::json::array()}
			};
			
			SPDLOG_TRACE("[@{}] Session created", author_id);
		}
		
		// get responee from the proxy
		SPDLOG_TRACE("[@{}] Request to proxy", author_id);
		Brain::BOT->request(session_obj["proxy"], dpp::http_method::m_post, [author_id, message, session_obj, content, start](const dpp::http_request_completion_t& res) {
			if (res.status != HttpStatus::toInt(HttpStatus::Code::OK))
			{
				SPDLOG_TRACE("[@{}] Proxy is not OK ({}: {})", author_id, res.status, res.body);
				int cancel_session = abort_session(session_obj, res.status);
				
				SPDLOG_TRACE("[@{}] Session aborted: {}", author_id, cancel_session);
				
				return;
			}
			
			SPDLOG_TRACE("[@{}] Proxy is OK", author_id);
			nlohmann::json session = nlohmann::json::parse(session_obj.dump());
			nlohmann::json body = nlohmann::json::parse(res.body);
			std::string generated_response = body["content"].get<std::string>();
			generated_response = clean_content(generated_response, "Brainbot", Constants::Regex::Cleverbot, author_id);
			
			session["context"].push_back(content);
			session["context"].push_back(generated_response);
			
			// shadow: is the original expiration of session without any value, we need to session object when the session expires, so i store double key
			Brain::REDIS->setex("shadow:session:" + author_id, Constants::TTL::ShadowSession, "0");
			Brain::REDIS->setex("session:" + author_id, Constants::TTL::Session, session.dump());
			
			// trigger typing indicator on discord
			Brain::BOT->request("https://discord.com/api/v10/channels/" + std::to_string(message.channel_id) + "/typing", dpp::http_method::m_post, [message, generated_response, author_id, start](const dpp::http_request_completion_t& res) {
				// make the typing a bit longer, the length of the response times 200 milliseconds
				std::this_thread::sleep_for(std::chrono::milliseconds(generated_response.size() * 100));
				
				std::optional<std::string> lmi = Brain::REDIS->get("last_message_id:" + std::to_string(message.channel_id));
				dpp::message ms = dpp::message(message.channel_id, generated_response);
				
				// check if the last message in the channel isn't this user message, so we can treat it as reply, otherwise normal message
				if (lmi && std::stoll(*lmi) != message.id) ms.set_reference(message.id);
				
				// respond :D
				SPDLOG_TRACE("[@{}] Responded.", author_id);
				Brain::BOT->message_create(const_cast<dpp::message&>(ms));
				DiscordLog::send(message, generated_response, true);
			}, "", "application/json", {
				{ "Authorization", "Bot "+Brain::Env("BRAIN_BOTD_TOKEN") }
			});
		}, session_obj.dump(), "application/json", {
			{"Accept", "application/json"},
			{"User-Agent", session_obj["useragent"]}
		});
	}).detach();
}

/**
 * all handle_* function are used to check data from redis or request new one
 */
void handle_member_checking(const dpp::message &message, nlohmann::json raw_message, dpp::channel current_channel, std::string raw_me_member, const std::chrono::time_point<std::chrono::system_clock> start)
{
	dpp::guild_member me_member_e;
	nlohmann::json me_member_j = nlohmann::json::parse(raw_me_member);
	dpp::guild_member me_member = me_member_e.fill_from_json(&me_member_j, message.guild_id, Brain::BOT->me.id);
	nlohmann::json member_timeout_time = me_member_j["communication_disabled_until"];
	
	std::chrono::time_point<std::chrono::system_clock> time_now = std::chrono::system_clock::now();
	long long time_now_ms = std::chrono::duration_cast<std::chrono::milliseconds>(time_now.time_since_epoch()).count();
	long long member_timeout_time_ms = member_timeout_time.is_null()? 0LL: iso_string_to_milliseconds(std::istringstream(member_timeout_time.get<std::string>()));
	
	// is the bot being timed out?
	if (!member_timeout_time.is_null() && member_timeout_time_ms > time_now_ms)
	{
		SPDLOG_TRACE("[@{}] Couldn't respond, currently being timed out", message.author.id);
		return;
	}
	
	// check for SEND_MESSAGE and VIEW_CHANNEL permissions
	uint64_t perms_in_this_channel = current_channel.get_user_permissions(me_member);
	bool is_granted = ((perms_in_this_channel & dpp::permissions::p_view_channel) == dpp::permissions::p_view_channel) && ((perms_in_this_channel & dpp::permissions::p_send_messages) == dpp::permissions::p_send_messages);
	
	if (!is_granted)
	{
		SPDLOG_TRACE("[@{}] Missing SEND_MESSAGES and/or VIEW_CHANNEL permission in #{}", message.author.id, current_channel.id);
		return;
	}
	
	SPDLOG_TRACE("[@{}] Allowed to respond in #{}", message.author.id, current_channel.id);
	respond(message, start, raw_message);
}

void handle_channel_checking(const dpp::message &message, nlohmann::json raw_message, const std::string guild_id, std::string raw_channel_data, std::multimap<std::string, std::string> discord_req_headers, const std::chrono::time_point<std::chrono::system_clock> start)
{
	dpp::channel this_channel_e;
	nlohmann::json this_channel_j = nlohmann::json::parse(raw_channel_data);
	dpp::channel this_channel = this_channel_e.fill_from_json(&this_channel_j);
	
	if (this_channel.id != message.channel_id) return;
	
	std::optional<std::string> me_member = Brain::REDIS->get("me_member:" + guild_id);
	
	if (!me_member)
	{
		SPDLOG_TRACE("[@{}] Fetching me_member", message.author.id);
		Brain::BOT->request("https://discord.com/api/v10/guilds/" + guild_id + "/members/" + std::to_string(Brain::BOT->me.id), dpp::http_method::m_get, [message, raw_message, guild_id, this_channel, start](const dpp::http_request_completion_t& res) {
			if (res.status != HttpStatus::toInt(HttpStatus::Code::OK)) return;
			
			handle_member_checking(message, raw_message, this_channel, res.body, start);
			Brain::REDIS->setex("me_member:" + guild_id, Constants::TTL::MeMemberCache, res.body);
		},  "", "application/json", discord_req_headers);
		
		return;
	}
	
	SPDLOG_TRACE("[@{}] Using me_member from cache", message.author.id);
	handle_member_checking(message, raw_message, this_channel, *me_member, start);
}

void handle_guild_data(const dpp::message &message, nlohmann::json raw_message, const std::string guild_id, std::string r_guild_data, const std::chrono::time_point<std::chrono::system_clock> start)
{
	const nlohmann::json json_guild_data = nlohmann::json::parse(r_guild_data);
	
	if (!json_guild_data["channel"].is_string()) set_channel_empty(guild_id);
	
	std::string channel_id = json_guild_data["channel"].get<std::string>();

	if (channel_id == "") return;

	std::optional<std::string> channel_in_cache = Brain::REDIS->get("channel:" + guild_id + ":" + channel_id);
	std::multimap<std::string, std::string> discord_req_headers = {
		{ "Accept", "application/json" },
		{ "Authorization", "Bot " + Brain::Env("BRAIN_BOTD_TOKEN") }
	};
	
	if (!channel_in_cache)
	{
		SPDLOG_TRACE("[@{}] Fetching channel", message.author.id);
		Brain::BOT->request("https://discord.com/api/v10/channels/" + channel_id, dpp::http_method::m_get, [message, raw_message, guild_id, json_guild_data, channel_id, discord_req_headers, start](const dpp::http_request_completion_t& res) {
			if (res.status != HttpStatus::toInt(HttpStatus::Code::OK)) {
				if (res.status == HttpStatus::toInt(HttpStatus::Code::NotFound)) set_channel_empty(guild_id);
				return;
			};
			
			handle_channel_checking(message, raw_message, guild_id, res.body, discord_req_headers, start);
			Brain::REDIS->setex("channel:" + guild_id + ":" + channel_id, Constants::TTL::ChannelCache, res.body);
		},  "", "application/json", discord_req_headers);
		
		return;
	}
	
	SPDLOG_TRACE("[@{}] Using channel from cache", message.author.id);
	handle_channel_checking(message, raw_message, guild_id, *channel_in_cache, discord_req_headers, start);
}

/**
 * this is the first function invoked
 */
void chatter(const dpp::message &message, nlohmann::json raw_message)
{
	const std::chrono::time_point<std::chrono::system_clock> start = std::chrono::system_clock::now();
	std::optional<std::string> lmi = Brain::REDIS->get("last_message_id:" + std::to_string(message.channel_id));
	
	if (lmi) Brain::REDIS->setex("last_message_id:" + std::to_string(message.channel_id), Constants::TTL::LastMessageId, std::to_string(message.id));
	if (message.author.is_bot()) return;
	
	SPDLOG_TRACE("[@{}] Processing message", message.author.id);
	
	if (!message.guild_id)
	{
		respond(message, start, raw_message);
		return;
	}
	
	const std::string guild_id = std::to_string(message.guild_id);
	std::optional<std::string> guild_data_cache = Brain::REDIS->get("guild_data:" + guild_id);
	
	if (!guild_data_cache)
	{
		SPDLOG_TRACE("[@{}] Fetching guild_data", message.author.id);
		mongocxx::collection chat_collections = Brain::MONGO->database(Brain::Env("DATABASE_NAME")).collection("chats");
		bsoncxx::stdx::optional<bsoncxx::document::value> guild_data = chat_collections.find_one(bsoncxx::builder::basic::make_document(bsoncxx::builder::basic::kvp("_id", guild_id)));
		if (!guild_data) return;

		const std::string str_guild_data = bsoncxx::to_json(*guild_data, bsoncxx::ExtendedJsonMode::k_relaxed);
		
		handle_guild_data(message, raw_message, guild_id, str_guild_data, start);
		Brain::REDIS->setex("guild_data:" + guild_id, Constants::TTL::GuildDataCache, str_guild_data);
		
		return;
	}
	
	SPDLOG_TRACE("[@{}] Using guild_data from cache", message.author.id);
	handle_guild_data(message, raw_message, guild_id, *guild_data_cache, start);
}