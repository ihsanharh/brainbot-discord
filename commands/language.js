const Discord = require("discord.js");
const { mainc } = require("../color.json");
const { scope, web } = require("../botconfig.json");

module.exports.run = async (bot, message, args) => {
    const embed = new Discord.MessageEmbed()
        .setColor(mainc)
        .setTitle('Supported Languange')
        .addField("This bot can speak in any language below",`Bahasa Indonesia, Bahasa Melayu, Català, Čeština, Dansk, Deutsc h, English, Español, Euskara, Filipino, Français, Galego, Hrvat ski, IsiZulu, Íslenska, Italiano, Lietuvių, Magyar, Nederlands, Norsk bokmål, Polski, Português, Română, Slovenščina, Suomi, S venska, Tiếng Việt, Türkçe, Ελληνικά, български, Pусский, Српск и, Українська, 한국어, 中文, 日本語, हिन्दी, ภาษาไทย`)
        .setTimestamp()
        .setThumbnail(bot.user.displayAvatarURL())
        .setFooter(`Brain Bot`, `${bot.user.displayAvatarURL()}`);
    message.channel.send(embed);
}

module.exports.help = {
    name: "language",
    aliases: ["languanges","lang","languange","language"]
}
