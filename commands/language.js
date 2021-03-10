const Discord = require("discord.js");
const botconfig = require("../botconfig.json");

module.exports.run = async (bot, message, args) => {
    if (message.channel.name === `${botconfig["🤖・bot-chat"]}`) {
        return
    }
    const embed = new Discord.MessageEmbed()
        .setColor('BLURPLE')
        .setTitle('Supported Languange')
        .addField("This bot can speak in any language below",`Bahasa Indonesia, Bahasa Melayu, Català, Čeština, Dansk, Deutsc h, English, Español, Euskara, Filipino, Français, Galego, Hrvat ski, IsiZulu, Íslenska, Italiano, Lietuvių, Magyar, Nederlands, Norsk bokmål, Polski, Português, Română, Slovenščina, Suomi, S venska, Tiếng Việt, Türkçe, Ελληνικά, български, Pусский, Српск и, Українська, 한국어, 中文, 日本語, हिन्दी, ภาษาไทย`)
        .addField('**Links**',`**[Website](https://brainbot-xyz.glitch.me) ● [Invite](https://discord.com/api/oauth2/authorize?client_id=796219147658854411&permissions=3072&scope=bot)**`)
        .setTimestamp()
        .setThumbnail(bot.user.displayAvatarURL())
        .setFooter(`Brain Bot`, `${bot.user.displayAvatarURL()}`);
    message.channel.send(embed);
}

module.exports.help = {
    name: "language",
    aliases: ["languanges","lang","language"]
}
