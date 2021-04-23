const puppeteer = require('puppeteer');
const {
  LOGIN_URL,
  STREAM_URL,
  STREAM_API,
  BASE_URL,
  SENECA_USERNAME,
  SENECA_PASSWORD,
} = require('../../config');

class Seneca {
  constructor(cookies) {
    this.cookies = cookies;
  }

  static login = async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (request.resourceType() === 'image') request.abort();
      else request.continue();
    });

    await page.goto(LOGIN_URL);

    await page.type('#userNameInput', SENECA_USERNAME);
    await page.type('#passwordInput', SENECA_PASSWORD);
    await page.waitForSelector('#submitButton');
    await page.click('#submitButton');
    await page.waitForNavigation({
      waitUntil: 'networkidle0',
    });

    const { cookies } = await page._client.send('Network.getAllCookies');
    if (!cookies) {
      return undefined;
    }

    await browser.close();
    return new Seneca(cookies);
  };

  getStream = async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (request.resourceType() === 'image') request.abort();
      else request.continue();
    });
    await page.setCookie(...this.cookies);

    let entries = [];
    page.on('response', async (response) => {
      if (response.url() === STREAM_API && response.status() === 200) {
        const result = await response.json();
        console.log(result?.sv_streamEntries?.length);
        if (result?.sv_streamEntries?.length) {
          entries = result.sv_streamEntries;
        }
      }
    });

    await page.goto(STREAM_URL, { waitUntil: 'networkidle0' });

    await browser.close();
    return entries;
  };

  getUpcomingDue = async () => {
    const entries = await this.getStream();
    const upcoming = [];

    entries.forEach((entry) => {
      const detail = {};

      const dueDate = entry.itemSpecificData.notificationDetails;
      if (dueDate) {
        detail.dueDate = new Date(dueDate).toLocaleDateString();
        if (detail.dueDate >= new Date()) {
          detail.url = `${BASE_URL}${entry.se_itemUri}`;
          detail.title = entry.itemSpecificData.title;
          detail.postDate = new Date(entry.se_timestamp).toLocaleString();
          upcoming.push(detail);
        }
      }
    });
    return upcoming;
  };

  getPastDue = async () => {
    const entries = await this.getStream();
    const upcoming = [];

    entries.forEach((entry) => {
      const detail = {};

      const dueDate = entry?.itemSpecificData?.notificationDetails?.dueDate;
      if (dueDate) {
        const date = new Date(dueDate);
        detail.dueDate = date.toLocaleString();
        if (date <= new Date()) {
          detail.url = `${BASE_URL}${entry.se_itemUri}`;
          detail.title = entry.itemSpecificData.title;
          detail.postDate = new Date(entry.se_timestamp).toLocaleString();
          upcoming.push(detail);
        }
      }
    });
    return upcoming;
  };
}

Seneca.login()
  .then(async (seneca) => {
    const upcoming = await seneca.getUpcomingDue();
    console.log(upcoming);
  })
  .catch((error) => {
    console.error(error);
  });

module.exports = Seneca;
