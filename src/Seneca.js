const puppeteer = require('puppeteer');
const {
  BASE_URL,
  LOGIN_URL,
  STREAM_URL,
  STREAM_API,
  SENECA_USERNAME,
  SENECA_PASSWORD,
} = require('../config');

// Connect to local Chrome websocket
const getBrowser = async () => puppeteer.connect({ browserWSEndpoint: 'ws://localhost:3000' });
class Seneca {
  constructor(cookies) {
    this.cookies = cookies;
  }

  static login = async () => {
    try {
      const browser = await getBrowser();
      const page = await browser.newPage();
      await page.setRequestInterception(true);
      // Stop all image requests
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
        timeout: 10000,
      });

      // Get all cookies through dev tools
      const { cookies } = await page._client.send('Network.getAllCookies');

      // Authenticated session should contain BbRouter cookie
      if (!cookies?.length || !cookies.some((cookie) => cookie.name === 'BbRouter')) {
        await browser.close();
        throw new Error('Username or password is incorrect');
      }

      await browser.close();
      return new Seneca(cookies);
    } catch (error) {
      console.error(error);
      throw new Error('Unable to login');
    }
  };

  getStream = async () => {
    try {
      if (!this.cookies?.length || !this.cookies.some((cookie) => cookie.name === 'BbRouter')) {
        throw new Error('Unable to authenticate');
      }

      const browser = await getBrowser();
      const page = await browser.newPage();
      // Stop all image requests
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        if (request.resourceType() === 'image') request.abort();
        else request.continue();
      });

      await page.setCookie(...this.cookies);

      // all stream entries
      let entries = [];
      // Catch response from STREAM_API request
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

      // Update cookies
      if (cookies?.length) {
        this.cookies = cookies;
      }

      await browser.close();
      return entries;
    } catch (error) {
      console.log(error);
      throw new Error('Unable to parse notification streams');
    }
  };

  filter = async (pastDue = false) => {
    const entries = await this.getStream();
    const due = [];

    // Filter entries based on dueDate, ignore if dueDate is null
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
    console.log(due.length);
    return due;
  };

  getUpcomingDue = async () => this.filter();

  getPastDue = async () => this.filter(true);
}

module.exports = Seneca;
