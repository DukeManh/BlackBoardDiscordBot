const Discord = require('discord.js');

const { TOKEN, BASE_URL } = require('../config');
const { getGif } = require('./util/util');
const Seneca = require('./lib/Seneca');

const client = new Discord.Client();
let seneca;

client.on('ready', async () => {
  seneca = await Seneca.login();
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
  } else if (content.startsWith('-seneca upcoming')) {
    message.channel.startTyping(1);
    try {
      const upcoming = await seneca.getUpcomingDue();
      message.channel.stopTyping();
      upcoming.forEach((due) => {
        const response = new Discord.MessageEmbed()
          .setTitle(due.title)
          .setURL(due.url)
          .setAuthor('Seneca', '', BASE_URL)
          .setDescription(due.dueDate);
        message.channel.send(response);
      });
    } catch (error) {
      message.channel.stopTyping();
      console.error(error, 'Unable to get upcoming due');
    }
  }
});

client.login(TOKEN);
