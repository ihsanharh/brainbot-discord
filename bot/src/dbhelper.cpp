#include "dbhelper.h"
#include "mongo.h"

bool set_channel_empty(std::string guild_id)
{
    mongocxx::collection chat_collections = Brain::MONGO->database(Brain::Env("DATABASE_NAME")).collection("chats");
    mongocxx::stdx::optional<bsoncxx::document::value> chat_data = chat_collections.find_one(bsoncxx::builder::basic::make_document(bsoncxx::builder::basic::kvp("_id", guild_id)));
    
    if (!chat_data || chat_data && (chat_data->view()["channel"].type() == bsoncxx::type::k_string) && (chat_data->view()["channel"].get_string().value == "")) return false;

    chat_collections.update_one(bsoncxx::builder::basic::make_document(bsoncxx::builder::basic::kvp("_id", guild_id)),
		bsoncxx::builder::basic::make_document(bsoncxx::builder::basic::kvp("$set", 
            bsoncxx::builder::basic::make_document(bsoncxx::builder::basic::kvp("channel", ""))
        ))
	);

    return true;
}