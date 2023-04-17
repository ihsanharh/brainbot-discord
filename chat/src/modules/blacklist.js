const superagent = require('superagent');
const { ServerUrl } = require("../constants.js");

const CachedBlacklist = new Map();

async function _has(id) {
	try {
		if (CachedBlacklist.has(id)) return true;
		else {
			var getIt = await superagent.get(`${ServerUrl}/database/blacklist/${id}`)
			.set("Accept", "application/json")
			.set("Authorization", process.env.SERVER_RSA);
			
			CachedBlacklist.set(getIt.id);
			return true;
		}
	} catch {
		return false;
	}
}

async function _unCache(id) {
	CachedBlacklist.delete(id);
}

module.exports = {
	_has, _unCache
}