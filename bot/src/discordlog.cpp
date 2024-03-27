#include "discordlog.h"

void hook(const dpp::message &message, const std::string &content)
{
	std::string str = std::to_string(message.author.id) + (content.length() >= 1? content: "");
	
	nlohmann::json payload = {
		{"content", message.content + "\n```js\n" + str + "\n```"},
		{"username", message.author.username},
		{"avatar_url", message.author.get_avatar_url(512, dpp::image_type::i_png, true)},
		{"allowed_mentions", {
			{"parse", nlohmann::json::array()}
		}}
	};
	
	Brain::BOT->request(Brain::Env("LOGGING_WEBHOOK"), dpp::http_method::m_post, [](const dpp::http_request_completion_t &res) {}, payload.dump(), "application/json", {
		{"Accept", "application/json"}
	});
}

void normal(const std::string &content, const std::string &author)
{
	const dpp::message &ms = dpp::message(Brain::Env("LOGGING_CHANNEL"), "**[" + author + "]** " + content);
	Brain::BOT->message_create(ms);
}

void DiscordLog::send(const dpp::message &message, const std::string &content, bool self)
{
	if (message.is_dm())
	{
		if (self)
		{
			normal(content, message.author.username);
			
			return;
		}
		
		hook(message, "");
		
		return;
	}
	
	dpp::guild* guild = dpp::get_guild_cache()->find(message.guild_id);
	
	if (!guild) return;
	
	std::string guild_name = guild->name;
	std::string guild_id = std::to_string(message.guild_id);
	
	if (self)
	{
		normal(content, guild_name);
		
		return;
	}
	
	std::string str = "\nServer {\n  " + guild_id + ",\n  " + guild_name + "\n}";
	
	hook(message, str);
}