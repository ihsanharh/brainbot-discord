const Discord = require("discord.js");
const botconfig = require("../botconfig.json");
const { scope, web } = require("../botconfig.json");
const { mainc } = require("../color.json")

module.exports.run = async (bot, message, args) => {
  const warn = new Discord.MessageEmbed()
  .setColor()
  .setDescription('Hey guys sorry, bot api is down were still looking into it, also because its came from api so we change the api to other one, we will fix this and will use normal api again soon;) ')
    const embed = new Discord.MessageEmbed()
        .setColor(mainc)
        .setTitle('Command list')
        .setDescription(`**\`${botconfig.prefix}botinfo  \`   | Bot Information \n\`${botconfig.prefix}language \`   | Supported language \n\`${botconfig.prefix}status   \`   | Statuspage \n\`${botconfig.prefix}help     \`   | Show the help menu \n\`${botconfig.prefix}setup    \`   | Setup the chat bot! \n\`${botconfig.prefix}delete   \`   | Deletes the bot configuration!**`)
        .addField('Beta Feature <:BETA:827180146644746301>', `**\`${botconfig.prefix}talk     \`   | Talk with brainbot through Voice Channel :p**\n(you should join vc first)`)
        .addField('**Links**',`**[Website](${web}) ● [Invite](https://discord.com/api/oauth2/authorize?client_id=796219147658854411&permissions=${scope}&scope=bot%20applications.commands)**`)
        .setTimestamp()
        .setThumbnail(bot.user.displayAvatarURL())
        .setFooter(`Brain Bot`, `${bot.user.displayAvatarURL()}`);
    message.channel.send(embed)
  message.channel.send(warn).then(warn => warn.delete({setTimeout: 100000}))
}

module.exports.help = {
    name: "help",
    aliases: ["cmds", "commands", "h", "hlp"]
}