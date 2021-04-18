const guildDB = require("../models/chat");
const { MessageEmbed } = require("discord.js");

module.exports.run = async (_bot, message) => {
  if (!message.member.hasPermission("MANAGE_CHANNELS")) {
    const embed1 = new MessageEmbed()
      .setColor(`#f04947`)
      .setDescription("<:BRAIN_XMARK:829169288942190633> **| You can't use that**")
    return message.channel.send(embed1)
  }
  const guild_is_present = await guildDB.findOne({ _id: message.guild.id })
  if (!guild_is_present) {
    const embed1 = new MessageEmbed()
      .setColor(`#f04947`)
      .setDescription("<:BRAIN_XMARK:829169288942190633> **| It seems like i never used here.**")
    return message.channel.send(embed1)
  } else {
    await guildDB.findOneAndDelete({
      _id: message.guild.id
    }).then(_ => {
      const embed3 = new MessageEmbed()
        .setColor(`#43b481`)
        .setDescription(`**<:BRAIN_CHECK:829169271963123752> | Successfully removed config**`)
      message.channel.send(embed3)
    })
  }
}

module.exports.help = {
  name: "delete",
  aliases: ["del"]
}
