const { Client } = require('javelin');
const env = require('dotenv').config();
const Discord = require('discord.js');

const client = new Discord.Client();
const serverList = {};
const pendingMessages = new Map(); // <string, string[]> ChatChannelID, Message
const discordCharLimit = Number(1999); // maximum size for a discord message

client.login(process.env.DCTOKEN); // Login with preset discord token in the .env file

// when discord has successfully connected (this section can be used to PM all users an update message)
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// creating of the twitch client
const twitch = new Client({
  oauth: process.env.OAUTH,
  username: 'discord_chat',
  oauth: process.env.OAUTH,
  channels: [],
});


// removes all non decimal characters from a string
const charRemove = (command) => {
  const channelString = /\d+/.exec(command);

  if (channelString !== null && channelString[0] !== null) {
    return channelString[0];
  }

  return '';
};

// sends a string to a specified discord channel ID
const sendMessage = (msg, channel) => {
  let success = true;
  if (msg.length !== 0) {
    if (!client.channels.get(channel)) {
      console.log(`ERROR: Can not find channel: ${channel}`);
    } else {
      client.channels.get(channel).send(msg).catch((e) => {
        success = false;
      });
    }
  }
  return success;
};

// class that contains relevant discord ids and twitch information for each user
class discordOutput {
  constructor(twitchChannel, chatChannel, ID) {
    this.twitchChannel = twitchChannel;
    this.chatChannel = chatChannel;
    this.ID = ID;
  }
}

// DISCORD SECTION
client.on('message', async (message) => {
  // split message into args (cutting out the prefix itself)
  const args = message.content
    .slice(process.env.DCPREFIX.length)
    .trim()
    .split(/ +/g);
  const command = args.shift().toLowerCase();

  // if message is from a bot ignore it
  if (message.author.bot) return;

  // if message does not contain prefix ignore it
  if (message.content.indexOf(process.env.DCPREFIX) !== 0) return;


  if (command === 'help') {
    message.reply('To start twitch chat use !start #channelname twitch_channel\nTo stop a twitch chat use !stop twitch_channel\nTo list your tracked channels use !list\nUse !invite to get an invite link');
  }

  // replys with an discord bot invite link
  if (command === 'invite') {
    message.reply('Enter your bots invite link').catch((e) => { });
  }


  // lists all twitch channels currently being followed in the server it was issued from
  if (command === 'list') {
    for (let x = 0; x < Object.keys(serverList).length; x += 1) {
      const server = serverList[Object.keys(serverList)[x]];
      if (server.ID === message.guild.id) {
        message.reply(server.twitchChannel).catch((e) => { });
      }
    }
  }

  // creates a new object and connects to the twitch channel that is provided
  if (command === 'start') {
    if (args.length !== 2) {
      message.reply('You need to set a #channel and a twitch channel to post/follow').catch((e) => { });
    } else {
      const chatChannel = charRemove(args[0]);
      const twitchChannel = (`#${args[1]}`).toLowerCase();
      const ID = message.guild.id;

      if (!client.channels.get(chatChannel)) {
        message.reply('That discord channel does not exist or I can not see it.').catch((e) => { });
      } else if (!serverList[ID + twitchChannel]) {
        serverList[ID + twitchChannel] = new discordOutput(twitchChannel, chatChannel, ID);
        //
        twitch.joinChannel(twitchChannel);
      }
    }
  }

  // stops following the given twitch channel
  if (command === 'stop') {
    if (args.length !== 1) {
      message.reply('You need to enter the twitch channel to stop tracking').catch((e) => { });
    }

    const twitchChannel = (`#${args[0]}`).toLowerCase();
    const ID = message.guild.id;

    delete serverList[ID + twitchChannel];
  }

  // this is used as an admin command to print out all currently followed twitch channels irrespective of discord server
  if (command === 'whosthere') {
    if (args.length !== 1) {
      message.reply('You need to enter the password').catch((e) => { });
    } else if (args[0] === process.env.MAGICPASS) { // magic password 
      let size = 0;
      let twitchArray = [];

      // iterate through all objects and print channels being followed
      for (let x = 0; x <= Object.keys(serverList).length; x += 1) { 
        const server = serverList[Object.keys(serverList)[x]];

        if (server) {
          const twitchList = `<https://www.twitch.tv/${server.twitchChannel.substr(1)}>`;

          // buffering
          if (size + twitchList.length > discordCharLimit) { 
            message.reply(twitchArray).catch((e) => { });
            size = 0;
            twitchArray = [];
          }
          size += twitchList.length;
          twitchArray.push(twitchList);
        }
      }
      message.reply(twitchArray).catch((e) => { });
      twitchArray = [];
    }
  }
});


twitch.on('message', (msg) => {
  for (let x = 0; x < Object.keys(serverList).length; x += 1) {
    const server = serverList[Object.keys(serverList)[x]];

    if (server && server.twitchChannel === msg.channel.name) {
      const fullMessage = String(msg.content);
      const messageList = fullMessage.split(' ');

      const serverEmojis = client.guilds.get(server.ID).emojis; 
      const users = client.guilds.get(server.ID).members;


      // replacing emojis with emoji characters found on the server
      // replacing @ tags with @names found on the server
      for (let x = 0; x < messageList.length; x += 1) {
        if (serverEmojis.find(emoji => emoji.name === messageList[x])) { 
          messageList[x] = serverEmojis.find(emoji => emoji.name === messageList[x]);
        } else if (users.find(user => `@${user.displayName}` === messageList[x])) { 
          messageList[x] = users.find(user => `@${user.displayName}` === messageList[x]);
        }
      }
      let processedMsg = '';

      for (const msg of messageList) {
        processedMsg += ` ${msg}`;
      }

      if (pendingMessages.get(server.chatChannel) === undefined) {
        pendingMessages.set(server.chatChannel, new Array().fill(`*** ${msg.user.displayName} *** :${processedMsg}`));
      } else {
        pendingMessages.get(server.chatChannel).push(`*** ${msg.user.displayName} *** :${processedMsg}`);
      }
    }
  }
});

// posting limit per server. will stop the bot bouncing off of the rate limit.
const msgInterval = 1300; 
setInterval(() => {
  for (const ch of pendingMessages.keys()) {
    toSend = '';
    for (const msg of pendingMessages.get(ch)) {
      if ((toSend.length + msg.length) > discordCharLimit) {
        sendMessage(toSend, ch);
        toSend = `${msg}\n`;
      } else {
        toSend += `${msg}\n`;
      }
    }
    sendMessage(toSend, ch);
  }
  pendingMessages.clear();
}, msgInterval);

// updating the bot status
const botStatusInt = 60 * 1000; 
setInterval(() => {
  client.user.setActivity(`Chatting in ${client.guilds.size} servers.`);

  const channelArray = [];
  const inUseArray = [];

  for (let x = 0; x < Object.keys(serverList).length; x += 1) {
    const server = serverList[Object.keys(serverList)[x]];
    inUseArray.push(server.twitchChannel);
  }

  for (const value of twitch.channels.values()) {
    channelArray.push(value.name);
  }

  for (let x = 0; x < channelArray.length; x += 1) {
    if (!inUseArray.includes(channelArray[x])) {
      twitch.leaveChannel(channelArray[x]);
    }
  }
}, botStatusInt);

twitch.login();
