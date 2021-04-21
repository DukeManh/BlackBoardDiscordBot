const dotenv = require('dotenv');

const env = dotenv.config();

if (env.error) {
  throw env.error;
}

const TENOR_URL = 'https://g.tenor.com/v1/';
const GIF_LIMIT = '10';
const Seneca = {
  LOGIN_URL: 'https://learn.senecacollege.ca/auth-saml/saml/login?apId=_850_1',
};

module.exports = {
  ...env.parsed,
  TENOR_URL,
  GIF_LIMIT,
  ...Seneca,
};
