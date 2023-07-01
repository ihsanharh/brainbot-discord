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
		static const std::string AddedBack           = "Oh hi again! Thanks for adding me back <3";
		static const std::string ContinueTalking     = "\n\nYou can continue talking to me in <#<#cid>> or run </setup:</setup>> command if you want to change the channel.";
		static const std::string FirstTime           = "Hey! Brain Bot is here, I'm an AI-Powered Chat Bot. Thanks for adding me to your server!";
		static const std::string SetupFirstTime      = "\n\nYou can start talking to me by sending me a DM or by running </setup:</setup>> to set the chat channel in this server. Use </help:</help>> to display the help menu.";
	}
}

#endif // BRAINBOT_CONSTANTS_H