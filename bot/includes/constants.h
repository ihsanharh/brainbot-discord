#ifndef BRAINBOT_CONSTANTS_H
#define BRAINBOT_CONSTANTS_H

namespace Constants
{
	namespace Emojis
	{
		static const std::string join                = "<:join:948669301022396566>";
		static const std::string leave               = "<:leave:948669326016274482>";
	}
	
	namespace Message
	{
		static const std::string AddedBack           = "Hello again! Thanks for re-adding me. <3";
		static const std::string ContinueTalking     = "\n\nYou can keep our chat going in <#<#cid>>, or if you're in the mood for a change, just use the </setup:</setup>> command to switch up the channel!";
		static const std::string FirstTime           = "Hello! Brain Bot is here—I'm an AI-powered chatbot. Thank you for adding me to your server!";
		static const std::string SetupFirstTime      = "\n\nFeel free to slide into my DMs, or set up a channel for our conversation using </setup:</setup>>. Need assistance? Give </help:</help>> a shot!";
	}
	
	namespace Regex
	{
		static std::string Brainbot = R"((?:b|B)(?:r|R)(?:a|A)(?:i|I)(?:n|N)\s?(?:b|B)(?:o|O)(?:t|T))";
		static std::string Cleverbot = R"((?:c|C)(?:l|L)(?:e|E)(?:v|V)(?:e|E)(?:r|R)\s?(?:b|B)(?:o|O)(?:t|T))";
	}
	
	/**
	 * Time To Live for redis cache, all of them in seconds except for MessageCooldown which is in milliseconds
 	*/
	namespace TTL
	{
		static long long ChannelCache                = 90;
		static long long GuildDataCache              = 120;
		static long long LastMessageId               = 6;
		static long long MeMemberCache               = 90;
		static long long MessageCooldown             = 3500;
		static long long Session                     = 70;
		static long long ShadowSession               = 60;
	}
}

#endif // BRAINBOT_CONSTANTS_H