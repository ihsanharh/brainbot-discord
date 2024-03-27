#include "listeners.h"
#include "xtra/alert.h"
#include <chrono> // chrono
#include <thread> // thread

void check_ready()
{
	static bool initialized = false;
	
	if (!initialized)
	{
		initialized = true;
		bool stop_checking = false;
		
		std::thread check_unavailable_guilds([&stop_checking]() {
			std::chrono::time_point<std::chrono::steady_clock> start_check_time = std::chrono::steady_clock::now();
			
			spdlog::info("DPP version: {}", dpp::utility::version());
			
			while(!stop_checking)
			{
				if (Brain::Unavailable_Guilds.empty())
				{
					spdlog::info("All guilds is now available");
					stop_checking = true;
				}
				
				std::chrono::time_point<std::chrono::steady_clock> current_check_time = std::chrono::steady_clock::now();
				if (std::chrono::duration_cast<std::chrono::seconds>(current_check_time - start_check_time).count() >= 30)
				{
					spdlog::info("30 seconds have passed. {} unavailable guilds left", Brain::Unavailable_Guilds.size());
					stop_checking = true;
				}
				
				std::this_thread::sleep_for(std::chrono::seconds(1));
			}
		});
		
		check_unavailable_guilds.join();
	}
}

void Listeners::onGuildCreate(const dpp::guild_create_t &event)
{
	if (event.created->is_unavailable() == 1) return;
	if (Brain::Unavailable_Guilds.find(std::to_string(event.created->id)) != Brain::Unavailable_Guilds.end())
	{
		Brain::Unavailable_Guilds.erase(std::to_string(event.created->id));
		check_ready();
		return;
	}
	
	send_hi_message(event.created);
	alert_join_leave(Constants::Emojis::join+" has been added to **"+event.created->name+"**\n**["+std::to_string(get_guild_count())+"]**");
}