const superagent = require('superagent');

const { ServerUrl } = require("../constants.js");

const CachedGuildRecord = new Map();
const CachedGuildChannels = new Map();

async function _channels(guild_id)
{
	try
    {
		if (CachedGuildChannels.has(guild_id))
		{
			return CachedGuildChannels.get(guild_id);
		}
		else
		{
			const fetched = await superagent.get(ServerUrl+"/_guild/"+guild_id+"/channels?permissionsfor="+process.env.DISCORD_APP_ID)
			.set("Authorization", process.env.SERVER_RSA)
			.set("Content-Type", "application/json");
			
			CachedGuildChannels.set(guild_id, fetched?._body);
			setTimeout(() => {
				CachedGuildChannels.delete(guild_id);
			}, 120000);
			
			return fetched?._body;
		}
	}
	catch (e)
	{
		console.error(e);
		return null;
	}
}

async function _delete(guild_id)
{
  if (CachedGuildRecord.has(guild_id))
	{
		CachedGuildRecord.delete(guild_id);
		
		return 1;
	}
	else
	{
		return 0;
	}
}

async function _get(guild_id)
{
	try
	{
		if (CachedGuildRecord.has(guild_id))
		{
			return CachedGuildRecord.get(guild_id);
		}
		else
		{
			const fetched = await superagent.get(ServerUrl+"/database/guild/"+guild_id)
			.set("Authorization", process.env.SERVER_RSA)
			.set("Content-Type", "application/json");
			
			CachedGuildRecord.set(guild_id, fetched?._body);
			return fetched?._body;
		}
	}
	catch (e)
	{
		return null;
	}
}

async function _updateOne(guild_id, new_record)
{
	try
	{
		CachedGuildRecord.set(guild_id, new_record);
		
		return 1;
	}
	catch (e)
	{
		return 0;
	}
}

module.exports = {
	_channels, _delete, _get, _updateOne
};