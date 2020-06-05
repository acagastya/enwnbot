const fetch = require('node-fetch');
const { shortURL, URL } = require('./config');
const TUrl = require('tinyurl');
const moment = require('moment-timezone');
const timezones = require('./time');

async function fetchData(URI) {
  const res = {};
  try {
    const data = await fetch(URI);
    const parsed = await data.json();
    res.list = parsed.query.categorymembers;
  } catch (error) {
    res.error = true;
    console.warn('Error in fetchData:', error);
  }
  return res;
}

function fullUrl(title) {
  let [main, anchor] = title.split('#');
  main = main.replace(/ /g, '%20');
  if (anchor) anchor = anchor.replace(/ /g, '_');
  let final;
  if (anchor) final = `${main}%23${anchor}`;
  else final = main;
  return `${URL}${final}`;
}

function getFullLink(link) {
  const len = link.length;
  const trimmed = link.substr(2, len - 4);
  const finalUrl = fullUrl(trimmed);
  return finalUrl;
}

function getFullTemplate(template) {
  const len = template.length;
  const word = template
    .substr(2, len - 4)
    .split('|')[0]
    .replace(/ /g, '%20');
  return `${URL}Template:${word}`;
}

function sayTime(msg, client, channel) {
  let arr = msg.split(' ').filter(Boolean);
  while (arr[1] != '!time') arr.shift();
  const user = arr[2];
  const timezone = timezones.get(user) || user;
  let time;
  try {
    time = moment().tz(timezone).format('HH:mm MMM DD');
  } catch (error) {
    time = `${moment().tz('UTC').format('HH:mm MMM DD')} UTC`;
  }
  client.say(channel, time);
}

module.exports = {
  fetchData,
  fullUrl,
  getFullLink,
  getFullTemplate,
  sayTime,
};
