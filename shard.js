const { ShardingManager } = require('discord.js');
const config = require('./botconfig');
const manager = new ShardingManager('./brainbot.js', { token: `${config.token}` });

manager.spawn();
manager.on('shardCreate', shard => {
    console.log(`Launched shard ${shard.id}`)
});