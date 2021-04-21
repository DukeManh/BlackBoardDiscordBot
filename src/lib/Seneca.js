const puppeteer = require('puppeteer');
const { LOGIN_URL, SENECA_USERNAME, SENECA_PASSWORD } = require('../../config');

class Seneca {
  static Cookie = [];

  static async login() {
    const browser = await puppeteer.launch();

    const page = await browser.newPage();
    await page.goto(LOGIN_URL);
    // await page.waitForSelector('#agree_button');
    // await page.click('#agree_button');
    // await page.waitForSelector('#bottom_Submit');
    // await page.click('#bottom_Submit');
    await page.screenshot({ path: 'screenshot.png' });

    await page.type('#userNameInput', SENECA_USERNAME);
    await page.type('#passwordInput', SENECA_PASSWORD);
    await page.waitForSelector('#submitButton');
    await page.click('#submitButton');
    await page.waitForNavigation();

    const cookies = await page.cookies();
    console.log(cookies);

    await browser.close();
  }
}

Seneca.login();

module.exports = Seneca;
