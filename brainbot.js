const Discord = require("discord.js");
const express = require("express");
const app = express();
const Topgg = require('@top-gg/sdk')
const api = new Topgg.Api('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijc5NjIxOTE0NzY1ODg1NDQxMSIsImJvdCI6dHJ1ZSwiaWF0IjoxNjE1MTk4Mzc5fQ.mWDkrAJ_UEX2YdzzwaIsylddC9V3f1vuJLcEK3y0m3Q')
const bot = new Discord.Client({
  disableEveryone: true
});
const guildDB = require("./models/chat");
const botconfig = require("./botconfig.json");
const fs = require("fs");
const chatcord = require("chatcord");
const chat = new chatcord.Client();
const mongoose = require("mongoose");
const { mongoURI } = require("./botconfig.json");

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
  })
  .then(_ => {
    console.log("DataBase connected ✓");
  });

setInterval(() => {
  api.postStats({
    serverCount: bot.guilds.cache.size
  })
}, 60000)

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
    console.log(`+ ${f} ✓`);
    bot.commands.set(props.help.name, props);

    props.help.aliases.forEach(alias => {
      bot.aliases.set(alias, props.help.name);
    });
  });
});

bot.on("ready", async () => {
  console.log(
    `online in ${bot.guilds.cache.size} servers`
  );
  console.log(` • ${bot.users.cache.filter(user => user.bot).size} Bots`);
  console.log(` • ${bot.users.cache.filter(user => !user.bot).size} Human`);
  console.log(` • ${bot.channels.cache.size} Channel`);
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
              const embed = new Discord.MessageEmbed()
                .setAuthor("Chat Bot", bot.user.avatarURL())
                .setDescription(
                  `Hey there! I am **Brain Bot**, an AI Powered Chat Bot\nTo get started type **--help**, or you can dm me\n\n`
                )
                .addField(
                  "**Links**",
                  `**[Website](https://brainbot-xyz.glitch.me) ● [Invite Me](https://discord.com/api/oauth2/authorize?client_id=796219147658854411&permissions=3072&scope=bot)**`
                )
                .setColor("BLURPLE")
                .setFooter("Have fun chatting with me!");
              channel.send(embed);
              found = 1;
            }
          }
        }
      }
    }
  });
});

bot.on("message", message => {
  if (message.author.bot) return false;

  if (
    message.content.includes("@here") ||
    message.content.includes("@everyone")
  )
    return false;

  if (message.mentions.has(bot.user.id)) {
    message.channel.send(
      "yo wassup? need help? run ` --help ` to see full help."
    );
  }
});

bot.on("message", async message => {
  if (message.channel.type === "dm") return;
  if (message.author.bot) return;
  let prefix = botconfig.prefix;
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
    chat.chat(message.cleanContent).then(reply => {
     message.channel.startTyping();
     setTimeout(function(){
      message.channel.stopTyping();
      message.reply(`${reply}`);
     }, 500)
    });
    return;
  }
  const guild_is_present = await guildDB.findOne({ _id: message.guild.id });
  if (!guild_is_present) {
    return;
  } else {
    guildDB.findOne(
      {
        _id: message.guild.id
      },
      async (err, data) => {
        if (err) throw err;
        const channel = message.guild.channels.cache.get(data.channel);
        if (message.channel.id !== channel.id) {
          return;
        } else {
          chat.chat(message.cleanContent).then(reply => {
           message.channel.startTyping();
           setTimeout(function(){
            message.channel.stopTyping();
            message.channel.send(`**${message.author.tag} :** ${reply}`);
           }, 500);
          });
          const requests = data.count;
          data.count = requests + 1;
          data.save();
        }
      }
    );
  }
});

app.get("/data/:serverID", (req, res) => {
  const guild = req.params.serverID;
  guildDB.findOne(
    {
      _id: guild
    },
    async (err, data) => {
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
            message:
              "It seems like you haven't chatted with the bot yet. Invite it and start chatting!"
          }
        };
        res.set("Content-Type", "application/json");
        res.status(200).send(JSON.stringify(message, null, 2));
      }
    }
  );
});

bot.login(botconfig.token);

app.listen(3244);
