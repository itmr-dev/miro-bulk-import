/* eslint-disable no-loop-func */
const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    product: 'chrome',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    // product: 'firefox',
    // executablePath: 'C:\\Program Files\\Firefox Developer Edition\\firefox.exe',
    headless: false,
    devtools: false,
    defaultViewport: {
      width: 1920,
      height: 1080,
    },
    args: ['-wait-for-browser'],
  });
  const page = await browser.newPage();
  await page.goto('https://miro.com/app/');
  await page.waitForFunction('window.location.pathname === "/app/dashboard/"', {
    timeout: 100000000,
  });
  await page.waitForRequest((request) => request.url().includes('user-connections'));
  await page.waitForSelector('.project-header__add-user');
  await page.click('.project-header__add-user');
  await page.waitForRequest((request) => request.url().includes('user-pictures'));

  const list = '';

  const searchInput = await page.$('body > div.rtb-modal--center.rtb-modal--medium.invite-to-project-modal.effect-fadein.effect-scale.md-centered.rtb-modal.md-show > div > ng-transclude > div.rtb-modal-container__content.rtb-modal-content > div.rtb-modal-content__body.rtb-modal-body > div.filterable-users-list > div.search-panel > input');
  // eslint-disable-next-line no-restricted-syntax
  for await (const email of list.split(' ')) {
    await searchInput.type(email);
    await page.waitForResponse((request) => request.url().includes('user-connections'));
    // await page.waitForRequest((request) => request.url().includes('user-pictures'));
    await page.click('.filterable-list__column-email');
    await searchInput.click({ clickCount: 3 });
    await searchInput.press('Backspace');
  }
})();
