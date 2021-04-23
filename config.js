const dotenv = require('dotenv');

const env = dotenv.config();

if (env.error) {
  throw env.error;
}

const TENOR_URL = 'https://g.tenor.com/v1/';
const GIF_LIMIT = '10';
const Seneca = {
  BASE_URL: 'https://learn.senecacollege.ca',
  LOGIN_URL: 'https://learn.senecacollege.ca/auth-saml/saml/login?apId=_850_1',
  HOME_URL: 'https://learn.senecacollege.ca/ultra',
  STREAM_URL: 'https://learn.senecacollege.ca/ultra/stream',
  STREAM_API: 'https://learn.senecacollege.ca/learn/api/v1/streams/ultra',
};

module.exports = {
  ...env.parsed,
  TENOR_URL,
  GIF_LIMIT,
  ...Seneca,
};
