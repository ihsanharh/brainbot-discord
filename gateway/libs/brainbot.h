#ifndef BRAINBOT_H_
#define BRAINBOT_H_

#include <cstdint> // uint32_t
#include <string> // string

void init_bot();

namespace brainbot
{
	namespace Config
	{
		                                               /*GUILDS*/ /*DIRECT_MESSAGES*/ /*GUILD_MESSAGES*/ /*MESSAGE_CONTENT*/ 
		static uint32_t Enabled_GatewayIntents       =   1 << 0  |     1 << 12       |     1 << 9       |       1 << 15;
		static uint32_t Shard_Count                  = 2;
		static const std::string Token               = std::getenv("BRAIN_BOTD_TOKEN");
		static const std::string ServerRsa           = std::getenv("SERVER_RSA");
		static const std::string ChatRsa             = std::getenv("CHATTER_RSA");
	}
	
	namespace Emojis
	{
		static const std::string join                = "<:join:948669301022396566>";
		static const std::string leave               = "<:leave:948669326016274482>";
	}
	
	namespace Utils
	{
		static const std::string discord_app_id      = std::getenv("DISCORD_APP_ID");
		static const std::string join_leave_channel  = std::getenv("JOIN_LEAVE_CHANNEL");
		static const std::string server_url          = std::getenv("SERVER_URL");
		static const std::string chatter_url         = std::getenv("CHATTER_URL");
	}
	
	namespace Message
	{
		static const std::string AddedBack           = "Oh hi again! Thanks for adding me back <3";
		static const std::string ContinueTalking     = "\n\nYou can continue talking to me in <#<#cid>> or run </setup:</setup>> command if you want to change the channel.";
		static const std::string FirstTime           = "Hey! Brain Bot is here, I'm an AI-Powered Chat Bot. Thanks for adding me to your server!";
		static const std::string SetupFirstTime      = "\n\nYou can start talking to me by sending me a DM or run </setup:</setup>> to set the chat channel in this server. Use </help:</help>> to display the help menu.";
	}
}

#endif /* BRAINBOT_H_ */