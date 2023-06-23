import { createClient } from 'redis';

const redis = createClient();

(async function()
{
	await redis.connect();
})();

export default redis;