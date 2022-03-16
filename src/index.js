#!/usr/bin/env node
/* eslint-disable no-loop-func */

import chalk from 'chalk';
import inquirer from 'inquirer';
import puppeteer from 'puppeteer';
import clipboard from 'clipboardy';
import { createSpinner } from 'nanospinner';

let emails = [];

const args = process.argv.slice(2);

async function handlePuppeteerError(error) {
  console.log(`

    ❌ Aborted!
    The script was cancelled by the user or an error occured
  `);
  if (args.includes('--verbose') || args.includes('-v')) console.log(`⚠️ Error: ${error.message}\n`);
  process.exit(1);
}

async function welcome() {
  console.log(`
  ${chalk.bgBlue('HOW IT WORKS')}
  This tool will help you invite multiple people to a Miro project at once.
  You just need a list of the email addresses you want to invite.
  `);
}

async function askEmails() {
  const copied = await clipboard.readSync()
  const parsedCopied = copied.includes('@') ? copied : null; 
  const input = await inquirer.prompt({
    name: 'emails',
    type: 'input',
    message: 'Please enter the email addresses you want to invite seperated by space',
    default() {
      return parsedCopied;
    }
  });
  emails = input.emails.split(' ');
}

async function filter() {
  const input = await inquirer.prompt({
    name: 'filter',
    type: 'checkbox',
    message: 'Please remove yourself from the list as well as accounts already invited',
    choices: emails
  });
  emails = emails.filter((email) => !input.filter.includes(email));
  console.log(`Removed: ${input.filter.join(', ')}`)
}

async function explainInvite() {
  console.log(`
    ${chalk.bgBlue('HOW TO INVITE')}
    The tool will now launch a new chrome window and open miro.
    Please login with your account and just select the correct project.
    From there please just wait for the tool to finish.
    It will select every email address for you.

    Once it added every email and the output shows done feel free to click the "Add" button.
  `);
  const input = await inquirer.prompt({
    name: 'ready',
    type: 'confirm',
    message: 'Are you ready to start the invitation process?',
  });
  if (!input.ready) {
    console.log(`
    ❌ Aborted!
    `);
    process.exit(1);
  }
}

async function invite() {
  const spinner = createSpinner('Starting Chrome...').start();
  const browser = await puppeteer.launch({
    headless: false,
    devtools: false,
    defaultViewport: null,
    args: ['--wait-for-browser'],
  }).catch(handlePuppeteerError);
  spinner.update({ text: 'Opening Miro...' });
  const page = await browser.newPage().catch(handlePuppeteerError);
  await page.goto('https://miro.com/app/').catch(handlePuppeteerError);
  spinner.update({ text: 'Waiting for login...' });
  await page.waitForFunction('window.location.pathname === "/app/dashboard/"', {
    timeout: 100000000,
  }).catch(handlePuppeteerError);
  spinner.update({ text: 'Waiting for project selection...' });
  await page.waitForRequest((request) => request.url().includes('user-connections')).catch(handlePuppeteerError);
  await page.waitForSelector('.project-header__add-user').catch(handlePuppeteerError);
  spinner.update({ text: 'Opening invite modal...' });
  await page.click('.project-header__add-user').catch(handlePuppeteerError);
  await page.waitForRequest((request) => request.url().includes('user-pictures')).catch(handlePuppeteerError);

  const searchInput = await page.$('body > div.rtb-modal--center.rtb-modal--medium.invite-to-project-modal.effect-fadein.effect-scale.md-centered.rtb-modal.md-show > div > ng-transclude > div.rtb-modal-container__content.rtb-modal-content > div.rtb-modal-content__body.rtb-modal-body > div.filterable-users-list > div.search-panel > input')
    .catch(handlePuppeteerError);
  // eslint-disable-next-line no-restricted-syntax
  for await (const email of emails) {
    spinner.update({ text: `Adding ${email}...` });
    await searchInput.type(email).catch(handlePuppeteerError);
    await page.waitForResponse((request) => request.url().includes('user-connections')).catch(handlePuppeteerError);
    // await page.waitForRequest((request) => request.url().includes('user-pictures'));
    await page.click('.filterable-list__column-email').catch(handlePuppeteerError);
    await searchInput.click({ clickCount: 3 }).catch(handlePuppeteerError);
    await searchInput.press('Backspace').catch(handlePuppeteerError);
  }
  spinner.success({ text: 'Added all emails!' });
}

async function done() {
  console.log(`
    ${chalk.bgGreenBright('SUCCESS')}
    All email addresses were added.
    You can now click the "Add" button.
    If your finished just exit Chrome or hit enter.
  `);
  await inquirer.prompt({
    name: 'done',
    type: 'input',
    message: 'Press enter to exit',
  });
  process.exit(0);
}

const sleep = (ms = 2000) => new Promise((resolve) => { setTimeout(resolve, ms); });

await welcome();
await askEmails();
await filter();
await explainInvite();
await invite();
await done();