const Discord = require("discord.js");
const botconfig = require("../botconfig.json");
const { scope, web } = require("../botconfig.json");
const { mainc } = require("../color.json");

module.exports.run = async (bot, message, args) => {
    const embed = new Discord.MessageEmbed()
        .setColor(mainc)
        .setTitle('Invite')
        .setAuthor('Invite', `${bot.user.displayAvatarURL()}`)
        .setDescription(`**[Invite me here](https://discord.com/api/oauth2/authorize?client_id=796219147658854411&permissions=${scope}&scope=bot%20applications.commands)**`)
        .addField('**Links!**',`** ● [Website](${web})**`)
        .setTimestamp()
        .setThumbnail(bot.user.displayAvatarURL())
        .setFooter(`Brain Bot`, `${bot.user.displayAvatarURL()}`);
    message.channel.send(embed);
}

module.exports.help = {
    name: "invite",
    aliases: ["inv", "invitelink"]
}
