#ifndef BRAINBOT_H
#define BRAINBOT_H

#include <iostream> // cout
#include <string> // string
#include <unordered_map> // unordered_map
#include <dpp/dpp.h> // dpp

class Brain
{
	public:
	                                                 /*GUILDS*/ /*DIRECT_MESSAGES*/ /*GUILD_MESSAGES*/ /*MESSAGE_CONTENT*/ 
	  static const uint32_t Enabled_GatewayIntents =   1 << 0  |     1 << 12       |     1 << 9       |       1 << 15;
	  static inline std::unordered_map<std::string, int> App{};
	  static dpp::cluster* BOT;
	  static inline std::unordered_map<std::string, bool> Unavailable_Guilds{};
	  
	  static inline std::string& Env(const std::string& key)
	  {
	  	loadEnv();
	  	if (!env.contains(key)) throw std::runtime_error("Cannot find "+ key + " on environment variables.");
	  	
	  	return env[key];
	  }
	  
	  static void loadEnv()
	  {
	  	std::ifstream file("./.env");
	  	
	  	if (!file.is_open()) throw std::runtime_error("Couldn't open env file.");
	  	
	  	std::string line;
	  	unsigned long pos;
	  	bool is_string;
	  	
	  	while (std::getline(file, line))
	  	{
	  		if (line.empty() || line[0] == '#') continue;
	  		if ((pos = line.find('=')) == std::string::npos) continue;
	  		if ((is_string = line[pos + 1] == '"') && line[line.size() - 1] != '"') throw std::runtime_error("Error parsing " + line + " in environment variable.");
	  		if (is_string)
	  		{
	  			env[line.substr(0, pos)] = line.substr(pos + 2, line.size() - pos - 3);
	  		}
	  		else
	  		{
	  			env[line.substr(0, pos)] = line.substr(pos + 1);
	  		}
	  	}
	  	
	  	file.close();
	  }
	  
	private:
	  static inline std::unordered_map<std::string, std::string> env{};
};

#endif // BRAINBOT_H