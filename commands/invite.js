const Discord = require("discord.js");
const botconfig = require("../botconfig.json");

module.exports.run = async (bot, message, args) => {
    if (message.channel.name === `${botconfig["🤖・bot-chat"]}`) {
        return
    }
    const embed = new Discord.MessageEmbed()
        .setColor('BLURPLE')
        .setTitle('Invite')
        .setAuthor('Chat Bot', `${bot.user.displayAvatarURL()}`)
        .setDescription(`**[Invite me here](https://discord.com/api/oauth2/authorize?client_id=796219147658854411&permissions=3072&scope=bot)**`)
        .addField('**Important Links!**',`** ● [Website](https://brainbot-xyz.glitch.me)**`)
        .setTimestamp()
        .setThumbnail(bot.user.displayAvatarURL())
        .setFooter(`Brain Bot`, `${bot.user.displayAvatarURL()}`);
    message.channel.send(embed);
}

module.exports.help = {
    name: "invite",
    aliases: ["inv", "invitelink"]
}
