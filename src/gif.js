const fetch = require('node-fetch');
const { TENOR_URL, TENOR_TOKEN, GIF_LIMIT } = require('../config');

const getGif = async (param) => {
  const url = `${TENOR_URL}search?q=${param}&key=${TENOR_TOKEN}&limit=${GIF_LIMIT}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const result = await response.json();
  const top10 = result.results;
  if (!top10.length) {
    return '';
  }

  const randomGif = top10[Math.floor(Math.random() * top10.length)];
  return randomGif.itemurl;
};

module.exports = {
  getGif,
};
