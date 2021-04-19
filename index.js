const Discord = require('discord.js');
const fetch = require('node-fetch');

const { TOKEN, TENOR_URL, TENOR_TOKEN, GIF_LIMIT } = require('./config');

const getGif = async (param) => {
  const url = `${TENOR_URL}search?q=${param}&key=${TENOR_TOKEN}&limit=${GIF_LIMIT}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const result = await response.json();

  const top10 = result.results;

  const randomGif = top10[Math.floor(Math.random() * top10.length)];

  return randomGif.itemurl;
};

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
      message.channel.send(gifUrl);
    } catch (error) {
      console.error('Gif not found');
    }
  }
});

client.login(TOKEN);
