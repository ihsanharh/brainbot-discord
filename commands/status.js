const Discord = require("discord.js");
const { mainc } = require("../color.json");
const { scope, web } = require("../botconfig.json");
const moment = require("moment");
const { stripIndent } = require('common-tags');

module.exports.run = async (bot, message, args) => {
 const d = moment.duration(message.client.uptime);
    const day = (d.days() == 1) ? `${d.days()} day` : `${d.days()} days`;
    const hours = (d.hours() == 1) ? `${d.hours()} hour` : `${d.hours()} hours`;
    const minutes = (d.minutes() == 1) ? `${d.minutes()} minutes` : `${d.minutes()} minutes`;
    const clientStats = stripIndent`
      Ping   :: ${Math.round(message.client.ws.ping)}ms
      Uptime :: ${day} ${hours}, ${minutes}
      `;
      const thirdparty = stripIndent`
      CloudFlare              :: operational 
      Tax Calculation Service :: operational
      `;
    const embed = new Discord.MessageEmbed()
      .setTitle('All Systems Operational')
      .addField('API <:online:829175772258107482>', `operational`)
      .addField('DATABASE <:online:829175772258107482>', `operational`)
      .addField('PROXY <:online:829175772258107482>', `operational`)
      .addField('HOSTING <:online:829175772258107482>', `operational`)
      .addField('BOT', `\`\`\`asciidoc\n${clientStats}\`\`\``)
      .addField('THIRD-PARTY', `\`\`\`asciidoc\n${thirdparty}\`\`\``)
       .setTimestamp()
       .setFooter(`Brain Bot`, `${bot.user.displayAvatarURL()}`)
       .setColor(mainc);
    message.channel.send(embed);
};

module.exports.help = {
  name: "status",
  aliases: ["stats","statuspage"]
};
