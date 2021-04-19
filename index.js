const Discord = require('discord.js');

const { TOKEN } = require('./config');
const { getGif } = require('./util');

const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('message', async (message) => {
  const content = message.content.toLowerCase().trim();
  if (content === 'hi') {
    message.channel.send('Hello');
  } else if (content.startsWith('gif ')) {
    try {
      const gifUrl = await getGif(content.slice(4));
      message.channel.startTyping(1);
      setTimeout(() => {
        message.channel.send(gifUrl);
        message.channel.stopTyping();
      }, 500);
    } catch (error) {
      console.error('Gif not found');
    }
  }
});

client.login(TOKEN);
