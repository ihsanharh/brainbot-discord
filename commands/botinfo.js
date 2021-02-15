const Discord = require("discord.js");
const botconfig = require("../botconfig.json");

module.exports.run = async (bot, message, args) => {
  if (message.channel.name === `${botconfig["🤖・bot-chat"]}`) {
    return;
  }
  const embed = new Discord.MessageEmbed()
    .setColor("BLURPLE")
    .setTitle("Bot Info")
    .setAuthor("Chat Bot", `${bot.user.displayAvatarURL()}`)
    .setDescription(
      "Brain Bot is a discord chat bot powered with AI from [cleverbot](https://cleverbot.com) chat with this bot in dm or setup in your server"
    )
    .addField("What's New", `**Last updated 7 Feb 2021**\nstart the conversation not only on the server but you can DM the bot directly`)
    .addField(
      "**Important Links!**",
      `**[Website](https://brainbot-xyz.glitch.me) ● [Invite](https://discord.com/api/oauth2/authorize?client_id=796219147658854411&permissions=3072&scope=bot)**`
    )
    .setTimestamp()
    .setThumbnail(bot.user.displayAvatarURL())
    .setFooter(`Brain Bot`, `${bot.user.displayAvatarURL()}`);
  message.channel.send(embed);
};

module.exports.help = {
  name: "botinfo",
  aliases: ["bi", "botinfo", "bot", "info"]
};
