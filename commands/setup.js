const guildDB = require("../models/chat");
const { MessageEmbed } = require("discord.js");

module.exports.run = async (_bot, message) => {
    if (!message.member.hasPermission("MANAGE_CHANNELS")) {
       const embed1 = new MessageEmbed()
           .setColor(`#f04947`)
           .setDescription("<:BRAIN_XMARK:829169288942190633> **| You can't use that!**")
       return message.channel.send(embed1)
    }
    const channel = message.mentions.channels.first();
    if (!channel) {
        const embed1 = new MessageEmbed()
            .setColor(`#f04947`)
            .setDescription(`<:BRAIN_XMARK:829169288942190633> **| Please mention a channel**`)
        return message.channel.send(embed1)
    }
    await guildDB.findOne({
        _id: message.guild.id
    }, async (err, data) => {
        if (err) throw err;
        if (data) {
            data.channel = channel.id
            data.save();
            const embed3 = new MessageEmbed()
                .setColor(`#43b481`)
                .setDescription(`<:BRAIN_CHECK:829169271963123752> **| Successfully setted in <#${channel.id}>**`)
            message.channel.send(embed3)
        } else {
            const newData = new guildDB({
                _id: message.guild.id,
                channel: channel.id
            });
            newData.save();
            const embed3 = new MessageEmbed()
                .setColor(`#43b481`)
                .setDescription(`<:BRAIN_CHECK:829169271963123752> **| Successfully setted in <#${channel.id}>**`)
            message.channel.send(embed3)
        }
    })
}

module.exports.help = {
    name: "setup",
    aliases: ["set"]
}
