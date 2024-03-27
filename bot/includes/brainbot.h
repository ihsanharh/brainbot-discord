#ifndef BRAINBOT_H
#define BRAINBOT_H
#define SPDLOG_ACTIVE_LEVEL SPDLOG_LEVEL_TRACE

#include <functional> // function
#include <iostream> // cout
#include <string> // string
#include <unordered_map> // unordered_map
#include <dpp/dpp.h> // dpp
#include <spdlog/spdlog.h> // spdlog
#include <sw/redis++/redis++.h> // sw

class Brain
{
	public:
	                                                /* GUILDS    GUILD_MEMBERS   GUILD_MESSAGES   DIRECT_MESSAGES   MESSAGE_CONTENT*/ 
	  static const uint32_t Enabled_GatewayIntents =   1 << 0  |     1 << 1    |     1 << 9     |     1 << 12     |     1 << 15;
	  static dpp::cluster* BOT;
	  static sw::redis::Redis* REDIS;
	  static inline std::unordered_map<std::string, bool> Unavailable_Guilds{};
	  
	  static inline std::string& Env(const std::string& key)
	  {
	  	loadFile("./.env", "=", [&](bool is_string, std::string line, unsigned long pos) {
	  		if (is_string)
	  		{
	  			env[line.substr(0, pos)] = line.substr(pos + 2, line.size() - pos - 3);
	  		}
	  		else
	  		{
	  			env[line.substr(0, pos)] = line.substr(pos + 1);
	  		}
	  	});
	  	
	  	if (!env.contains(key)) spdlog::error("Cannot find {} on environment variables.", key);
	  	
	  	return env[key];
	  }
	  
	  static void loadFile(std::string path, std::string separator, std::function<void(bool, std::string, unsigned long)> callback)
	  {
	  	std::ifstream file(path);
	  	
	  	if (!file.is_open()) spdlog::error("Couldn't open {}", path);
	  	
	  	std::string line;
	  	unsigned long pos;
	  	bool is_string;
	  	
	  	while (std::getline(file, line))
	  	{
	  		if (line.empty() || line[0] == '#') continue;
	  		if ((pos = line.find(separator)) == std::string::npos) continue;
	  		if ((is_string = line[pos + 1] == '"') && line[line.size() - 1] != '"') spdlog::error("Error parsing {} in {}", line, path);
	  		callback(is_string, line, pos);
	  	}
	  	
	  	file.close();
	  }
	  
	private:
	  static inline std::unordered_map<std::string, std::string> env{};
};

#endif // BRAINBOT_H