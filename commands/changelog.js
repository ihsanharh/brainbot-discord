const Discord = require("discord.js");
const botconfig = require("../botconfig.json");

module.exports.run = async (bot, message, args) => {
  if (message.channel.name === `${botconfig["🤖・bot-chat"]}`) {
    return;
  }
  const embed = new Discord.MessageEmbed()
    .setColor("BLURPLE")
    .setTitle("Last Updated 5 Feb 2021")
    .setAuthor("Whats New", `${bot.user.displayAvatarURL()}`)
    .setDescription(
      "I made things more awesome! An update here.It all adds up to a better experience for you.\n\n**if you had any suggestion feel free to use --suggest commands:)**"
    )
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
  name: "changelog",
  aliases: ["changelogs", "update", "newfeature", "chang"]
};
