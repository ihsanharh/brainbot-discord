const Discord = require("discord.js");
const { mainc } = require("../color.json");
const { scope, web } = require("../botconfig.json");

module.exports.run = async (bot, message, args) => {
  let {guild} = message;
  const embed = new Discord.MessageEmbed()
    .setColor(mainc)
    .setDescription('Thank you for your vote')
  message.channel.send(embed).then(message => {
    message.delete({timeout: 5000})
  })
  const channel = bot.channels.cache.get('819740521228271637') 
  channel.send(`**${message.author.tag}** want new feature, he/she is from **${guild.name}**`)
};

module.exports.help = {
  name: "upvote",
  aliases: ["vote","v"]
};
