const Discord = require("discord.js");
const botconfig = require("../botconfig.json");
const { scope, web } = require("../botconfig.json");
const { mainc } = require("../color.json")

module.exports.run = async (bot, message, args) => {
  const embed = new Discord.MessageEmbed()
    .setColor(mainc)
    .setTitle("Bot Info")
    .setAuthor("Bot info", `${bot.user.displayAvatarURL()}`)
    .setDescription(
      "Brain Bot is a discord chat bot powered with AI from [cleverbot](https://cleverbot.com), chat with this bot on dm or setup in your server, do ` --languange ` to check supported languange"
    )
    .addField("Links",
      `**[Website](${web}) ● [Invite](https://discord.com/api/oauth2/authorize?client_id=796219147658854411&permissions=${scope}&scope=bot%20applications.commands)**`
    )
    .setImage("https://i.imgur.com/1tPto2O.jpeg")
    .setTimestamp()
    .setFooter(`Brain Bot`, `${bot.user.displayAvatarURL()}`);
  message.channel.send(embed);
};

module.exports.help = {
  name: "botinfo",
  aliases: ["bi", "botinfo", "bot", "info"]
};
