const Discord = require('discord.js');

const { TOKEN, BASE_URL } = require('../config');
const { getGif } = require('./gif');
const Seneca = require('./Seneca');

const client = new Discord.Client();

let seneca;

Seneca.login().then((bbSeneca) => {
  seneca = bbSeneca;
});

client.on('ready', async () => {
  seneca = await Seneca.login();
  console.log(`Logged in as ${client.user.tag}`);
});

// TODO: properly handle commands after prefix
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
    let sec = 0;
    const inter = setInterval(() => {
      sec += 1;
      console.log(sec);
    }, 1000);
    try {
      let upcoming = await seneca.getUpcomingDue();
      if (!upcoming?.length) {
        message.channel.send("You're good");
        message.channel.stopTyping();
        return;
      }

      upcoming = upcoming.map((due) => {
        const field = {
          name: `${due.title}, ${due.dueDate}`,
          value: due.url,
        };
        return field;
      });

      const response = new Discord.MessageEmbed()
        .setTitle('Upcoming assignments')
        .setURL(BASE_URL)
        .setDescription(`All assignments with due dates before ${new Date().toLocaleString()}`)
        .addFields(...upcoming);

      message.channel.stopTyping();
      message.channel.send(response);
    } catch (error) {
      message.channel.stopTyping();
      console.error(error, 'Unable to get upcoming due');
    } finally {
      clearInterval(inter);
    }
  }
});

client.login(TOKEN);
