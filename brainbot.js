require("dotenv").config();
const Discord = require("discord.js");
const express = require("express");
const app = express();
const Topgg = require("@top-gg/sdk");
const api = new Topgg.Api(process.env.TOPGG);
const bot = new Discord.Client({ disableEveryone: true });
const guildDB = require("./models/chat");
const chat = require("cleverbot-free");
const fs = require("fs");
const mongoose = require("mongoose");
const { invite, web, logch, prefix } = require("./botconfig.json");

mongoose
  .connect(process.env.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  .then(_ => {
    console.log("Connected To MongoDB");
  });

setInterval(() => {
  api.postStats({
    serverCount: bot.guilds.cache.size
  });
}, 60000);

bot.commands = new Discord.Collection();
bot.aliases = new Discord.Collection();

fs.readdir("./commands/", (err, files) => {
  if (err) console.log(err);
  let jsfile = files.filter(f => f.split(".").pop() === "js");
  if (jsfile.length <= 0) {
    console.log("Could not find any commands.");
    return;
  }
  jsfile.forEach(f => {
    let props = require(`./commands/${f}`);
    console.log(`+ ${f} loaded`);
    bot.commands.set(props.help.name, props);

    props.help.aliases.forEach(alias => {
      bot.aliases.set(alias, props.help.name);
    });
  });
});

bot.on("ready", async () => {
  console.log(`online in ${bot.guilds.cache.size} servers`);
});

bot.on("guildCreate", guild => {
  let found = 0;
  guild.channels.cache.map(channel => {
    if (found === 0) {
      if (channel.type === "text") {
        if (channel.permissionsFor(bot.user).has("VIEW_CHANNEL") === true) {
          if (channel.permissionsFor(bot.user).has("SEND_MESSAGES") === true) {
            if (
              channel.permissionsFor(bot.user).has("SEND_MESSAGES") === true
            ) {
              let message = `<:xyzz_join:889863595301683250> has joined **${guild.name}**(${guild.id})\n**- Member Count:** ${guild.memberCount}\n[${bot.guilds.cache.size}]`
              
              const embed = new Discord.MessageEmbed()
                .setAuthor("Brain Bot", bot.user.avatarURL())
                .setDescription(
                  `Hey there! I am **Brain Bot**, an AI Powered Chat Bot\nTo get started type **--help**, or you can dm me\n\n`
                )
                .addField("**Links**", `**[Website](${web})**`)
                .setColor("BLURPLE")
                .setFooter("Have fun chatting with me!");
              channel.send(embed).then(async c => {
                const hook = new Discord.WebhookClient({ id: process.env.HOOK_ID, token: process.env.HOOK_TOKEN })
                await hook.send(message, {
                  username: bot.user.username,
                  avatarURL: bot.user.displayAvatarURL(),
                })
              })
              found = 1;
            }
          }
        }
      }
    }
  });
});

bot.on("guildDelete", async guild => {
  const hook = new Discord.WebhookClient({ id: process.env.HOOK_ID, token: process.env.HOOK_TOKEN })
  
  await hook.send(`<:xyzz_leave:889863649785688074> has been kicked from **${guild.name}**(${guild.id})\n**- OwnerId:** ${guild.owner.user.id}\n[${bot.guilds.cache.size}]`, {
    username: bot.user.username,
    avatarURL: bot.user.displayAvatarURL()
  })
}) 

bot.on("message", message => {
  const messages = [
    "yo wassup? need help run ` --help `",
    "what? you can just run ` --help ` sir",
    "what now?!! i told you just run ` --help ` dont ping me.",
    "dont ping me! ,you know you can just run ` --help `"
  ];
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  if (message.author.bot) return false;

  if (
    message.content.includes("@here") ||
    message.content.includes("@everyone")
  )
    return false;

  if (message.mentions.has(bot.user.id)) {
    return message.channel.send(randomMessage);
  }
});

bot.on("message", async message => {
  if (message.channel.type === "dm") return;
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;
  let args = message.content
    .slice(prefix.length)
    .trim()
    .split(/ +/g);
  let cmd;
  cmd = args.shift().toLowerCase();
  let command;
  let commandfile = bot.commands.get(cmd.slice(prefix.length));
  if (commandfile) commandfile.run(bot, message, args);
  if (bot.commands.has(cmd)) {
    command = bot.commands.get(cmd);
  } else if (bot.aliases.has(cmd)) {
    command = bot.commands.get(bot.aliases.get(cmd));
  }
  try {
    command.run(bot, message, args);
  } catch (e) {
    return;
  }
});

bot.on("message", async message => {
  if (message.author.bot) return;
  if (!message.guild) {
    chat(message.cleanContent).then(reply => {
      message.channel.startTyping();
      setTimeout(function() {
        message.channel.stopTyping();
        message.reply(`${reply}`);
      }, 500);
    });
    return;
  }
  const guild_is_present = await guildDB.findOne({ _id: message.guild.id });
  if (!guild_is_present) {
    return;
  } else {
    guildDB.findOne({ _id: message.guild.id }, async (err, data) => {
      if (err) throw err;
      const channel = message.guild.channels.cache.get(data.channel);

      if (message.channel.id !== channel.id) {
        return;
      } else {
        chat(message.cleanContent).then(reply => {
          message.channel.startTyping();
          setTimeout(function() {
            message.channel.stopTyping();
            message.channel.send(`**${message.author.tag} :** ${reply}`);
          }, 500);
        });
        const requests = data.count;
        data.count = requests + 1;
        data.save();
      }
    });
  }
});

app.get("/data/:serverID", (req, res) => {
  const guild = req.params.serverID;
  guildDB.findOne({ _id: guild }, async (err, data) => {
    if (err) throw err;
    if (data) {
      const message = {
        success: "true",
        chat: {
          messages: data.count,
          channel: {
            ID: data.channel,
            name: "#" + bot.channels.cache.get(data.channel).name,
            link: `https://discord.com/channels/${guild}/${data.channel}`
          }
        }
      };
      res.set("Content-Type", "application/json");
      res.status(200).send(JSON.stringify(message, null, 2));
    } else {
      const message = {
        success: "false",
        data: {
          message: "setup first"
        }
      };
      res.set("Content-Type", "application/json");
      res.status(200).send(JSON.stringify(message, null, 2));
    }
  });
});

bot.login(process.env.TOKEN);

app.listen(3244);
