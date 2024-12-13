#include "brainbot.h" // Brain
#include "listeners.h" // Listeners
#include "xtra/alert.h" // get_guild_count
#include <chrono> // chrono
#include <thread>
#include <mutex>
#include <mongocxx/instance.hpp> // mongocxx::instance

/**
 * caching policy. to save up ram, only cache role and guild in the memory
 * -user, -emoji,
 * +role, -channel,
 * +guild
 */
constexpr dpp::cache_policy_t cache_policy {
	dpp::cache_policy_setting_t::cp_none, dpp::cache_policy_setting_t::cp_none,
	dpp::cache_policy_setting_t::cp_aggressive, dpp::cache_policy_setting_t::cp_none,
	dpp::cache_policy_setting_t::cp_aggressive
};
// Construct cluster: TOKEN, Intents, Shards Count, Cluster id, Max Cluster, Compress, cache policy, Discord request thread, External request thread
dpp::cluster Client(Brain::Env("BRAIN_BOTD_TOKEN"), Brain::Enabled_GatewayIntents, std::stoi(Brain::Env("SHARDS_COUNT")), 0, 1, true, cache_policy, 15, 15);
dpp::cluster* Brain::BOT = &Client;

// Connect to MongoDB
mongocxx::instance instance{};
mongocxx::client Mongo{mongocxx::uri{Brain::Env("DATABASE_URL")}};
mongocxx::client* Brain::MONGO = &Mongo;

// Create Redis Object
sw::redis::Redis RedisClient(Brain::Env("REDIS")+"?socket_timeout=50ms");
sw::redis::Redis* Brain::REDIS = &RedisClient;

// Create a pub/sub from created redis object
sw::redis::Subscriber redis_subscriber = Brain::REDIS->subscriber();
std::mutex redisSubscriberMutex; // mutex synchronization

void consumeSubscriber()
{
	SPDLOG_TRACE("Consuming Redis subscriber");
	
	while (true)
	{
		try 
		{
			{
				std::lock_guard<std::mutex> lock(redisSubscriberMutex);
				redis_subscriber.consume();
			}
		} 
		catch (const sw::redis::TimeoutError &error) 
		{
			continue;
		}
		catch (const sw::redis::Error &error)
		{
			spdlog::error("{}", error.what());
		}
	}
}

void update_guild_count()
{
	std::thread([]() {
		while (true)
		{
			uint64_t count = get_guild_count();

			SPDLOG_TRACE("Guild count updated to {}", std::to_string(count));
			std::this_thread::sleep_for(std::chrono::seconds(60));
		}
	}).detach();
}

void Listeners::bind()
{
	SPDLOG_TRACE("Binding listeners");
	
	Brain::BOT->on_channel_update(onChannelUpdate);
	Brain::BOT->on_guild_create(onGuildCreate);
	Brain::BOT->on_guild_delete(onGuildDelete);
	Brain::BOT->on_guild_member_update(onGuildMemberUpdate);
	Brain::BOT->on_message_create(onMessageCreate);
	Brain::BOT->on_message_update(onMessageUpdate);
	Brain::BOT->on_ready(onReady);
	
	redis_subscriber.on_pmessage(onKeyExpires);
	redis_subscriber.psubscribe("*expired");
	
	std::thread([]() {
		consumeSubscriber();
	}).detach();
}

void check_redis()
{
	SPDLOG_TRACE("Pinging to Redis");
	try
	{
		std::string pinged = Brain::REDIS->ping();
		spdlog::info("Redis returned {}", pinged);
	}
	catch (sw::redis::IoError err)
	{
		spdlog::error("Failed to connect to Redis. Please fix it or the bot wouldn't work as expected");
	}
}

int main()
{
	spdlog::set_level(spdlog::level::trace);
	Listeners::bind();
	check_redis();
	update_guild_count();

	Brain::BOT->start(dpp::st_wait);
	
	return 0;
}