const puppeteer = require('puppeteer');
const fetch = require('node-fetch');
const {
  LOGIN_URL,
  STREAM_URL,
  BASE_URL,
  SENECA_USERNAME,
  SENECA_PASSWORD,
} = require('../../config');

class Seneca {
  constructor(cookiesObj) {
    this.cookies = cookiesObj;
  }

  static login = async () => {
    const browser = await puppeteer.launch();

    const page = await browser.newPage();
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
    const cookiesObj = {};

    cookies.forEach((cookie) => {
      if (cookie.name === 'JSESSIONID') {
        if (cookie.path === '/learn/api') {
          cookiesObj[cookie.name] = cookie.value;
        }
      } else {
        cookiesObj[cookie.name] = cookie.value;
      }
    });

    await browser.close();
    return new Seneca(cookiesObj);
  };

  stringifyCookies = (...nameList) => {
    let cookieStr = '';
    nameList.forEach((name) => {
      if (this.cookies[name]) {
        cookieStr += `${cookieStr.length ? '; ' : ''}${name}=${this.cookies[name]}`;
      } else {
        console.error(`Cookie ${name} doesn't not exist`);
      }
    });
    return cookieStr;
  };

  getStream = async () => {
    const requestPayload = {
      providers: {
        bb_deployment: {
          sp_provider: 'bb_deployment',
          sp_newest: -1,
          sp_oldest: 9007199254740992,
          sp_refreshDate: new Date().getTime(),
        },
        bb_tel: {
          sp_newest: -1,
          sp_oldest: 9007199254740992,
          sp_provider: 'bb_tel',
          sp_refreshDate: 0,
        },
      },
      forOverview: false,
      retrieveOnly: true,
      flushCache: false,
    };

    const cookiesStr = this.stringifyCookies('JSESSIONID', 'AWSELB', 'AWSELBCORS', 'BbRouter');
    const response = await fetch(STREAM_URL, {
      method: 'post',
      headers: {
        cookie: cookiesStr,
        'content-type': 'application/json;charset=utf-8',
      },
      body: JSON.stringify(requestPayload),
    });

    const result = await response.json();
    return result.sv_streamEntries || [];
  };

  getUpcomingDue = async () => {
    const entries = await this.getStream();
    const upcoming = [];

    entries.forEach((entry) => {
      const detail = {};

      const { dueDate } = entry.itemSpecificData.notificationDetails;
      detail.dueDate = new Date(dueDate).toLocaleDateString();
      if (detail.dueDate >= new Date()) {
        detail.url = `${BASE_URL}${entry.se_itemUri}`;
        detail.title = entry.itemSpecificData.title;
        detail.postDate = new Date(entry.se_timestamp).toLocaleString();
        upcoming.push(detail);
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
