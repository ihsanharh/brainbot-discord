const Discord = require("discord.js");
const botconfig = require("../botconfig.json");

module.exports.run = async (bot, message, args) => {
    if (message.channel.name === `${botconfig["🤖・bot-chat"]}`) {
        return
    }
    const embed = new Discord.MessageEmbed()
        .setColor('BLURPLE')
        .setTitle('Command list')
        .setDescription(`**\`${botconfig.prefix}botinfo  \`   | Bot Information \n\`${botconfig.prefix}language  \`   | supported language \n\`${botconfig.prefix}status   \`   | Statuspage \n\`${botconfig.prefix}help     \`   | Show the help menu \n\`${botconfig.prefix}setup    \`   | Setup the chat bot! \n\`${botconfig.prefix}delete   \`   | Deletes the bot configuration!**`)
        .addField('**Links**',`**[Website](https://brainbot-xyz.glitch.me) ● [Invite](https://discord.com/api/oauth2/authorize?client_id=796219147658854411&permissions=3072&scope=bot)**`)
        .setTimestamp()
        .setThumbnail(bot.user.displayAvatarURL())
        .setFooter(`Brain Bot`, `${bot.user.displayAvatarURL()}`);
    message.channel.send(embed);
}

module.exports.help = {
    name: "help",
    aliases: ["cmds", "commands", "h", "hlp"]
}
"hlp"]
}
