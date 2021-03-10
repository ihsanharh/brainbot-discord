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
      "Brain Bot is a discord chat bot powered with AI from [cleverbot](https://cleverbot.com), chat with this bot on dm or setup in your server, do ` --languange ` to check supported languange"
    )
    .addField("Links",
      `**[Website](https://brainbot-xyz.glitch.me) ● [Invite](https://discord.com/api/oauth2/authorize?client_id=796219147658854411&permissions=3072&scope=bot)**`
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
