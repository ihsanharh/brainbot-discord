const Discord = require("discord.js");
const botconfig = require("../botconfig.json")
const moment = require("moment");
const { stripIndent } = require('common-tags');

module.exports.run = async (bot, message, args) => {
  if (message.channel.name === `${botconfig["🤖・bot-chat"]}`) {
    return;
  }
 const d = moment.duration(message.client.uptime);
    const hours = (d.hours() == 1) ? `${d.hours()} hour` : `${d.hours()} hours`;
    const minutes = (d.minutes() == 1) ? `${d.minutes()} minutes` : `${d.minutes()} minutes`;
    const seconds = (d.seconds() == 1) ? `${d.seconds()} seconds` : `${d.seconds()} seconds`;
    const clientStats = stripIndent`
      Ping   :: ${Math.round(message.client.ws.ping)}ms
      Uptime :: ${hours}, ${minutes}, ${seconds}
      `;
      const thirdparty = stripIndent`
      CloudFlare              :: operational 
      Tax Calculation Service :: operational
      `;
    const embed = new Discord.MessageEmbed()
      .setTitle('All Systems Operational')
      .addField('API', `operational <:tickYes:813631438749696010>`)
      .addField('DATABASE', `operational <:tickYes:813631438749696010>`)
      .addField('PROXY', `operational <:tickYes:813631438749696010>`)
      .addField('HOSTING', `operational <:tickYes:813631438749696010>`)
      .addField('BOT', `\`\`\`asciidoc\n${clientStats}\`\`\``)
      .addField('THIRD-PARTY', `\`\`\`asciidoc\n${thirdparty}\`\`\``)
      .addField('**Links**',`**[Website](https://brainbot-xyz.glitch.me) ● [Invite](https://discord.com/api/oauth2/authorize?client_id=796219147658854411&permissions=3072&scope=bot)**`)
       .setTimestamp()
       .setFooter(`Brain Bot`, `${bot.user.displayAvatarURL()}`)
       .setColor("BLURPLE");
    message.channel.send(embed);
};

module.exports.help = {
  name: "status",
  aliases: ["stats","statuspage"]
};
