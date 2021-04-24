const puppeteer = require('puppeteer');
const {
  BASE_URL,
  LOGIN_URL,
  STREAM_URL,
  STREAM_API,
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

    const { cookies } = await page._client.send('Network.getAllCookies');
    if (cookies) {
      this.cookies = cookies;
    }

    await browser.close();
    return entries;
  };

  filter = async (pastDue = false) => {
    const entries = await this.getStream();
    const due = [];

    entries.forEach((entry) => {
      const detail = {};

      const dueDate = entry?.itemSpecificData?.notificationDetails?.dueDate;
      if (dueDate) {
        const date = new Date(dueDate);
        detail.dueDate = date.toLocaleString();
        const now = new Date();
        if (pastDue ? date <= now : date >= now) {
          detail.url = `${BASE_URL}${entry.se_itemUri}`;
          detail.title = entry.itemSpecificData.title;
          detail.postDate = new Date(entry.se_timestamp).toLocaleString();
          due.push(detail);
        }
      }
    });
    return due;
  };

  getUpcomingDue = async () => this.filter();

  getPastDue = async () => this.filter(true);
}

module.exports = Seneca;
