const fetch = require('node-fetch');
const { shortURL, URL } = require('./config');
const TUrl = require('tinyurl');

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

async function urlShortener(URI, bot) {
  const req = `${shortURL}${URI}`;
  const res = {};
  try {
    const data = await bot.rawRequest({
      action: 'shortenurl',
      format: 'json',
      uri: req,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const parsed = JSON.parse(data);
    res.url = parsed.shortenurl.shorturl;
  } catch (error) {
    res.err = true;
    console.warn('Error in urlShortener:', error);
  }
  return res;
}

async function urlShortener1(URI) {
  const res = {};
  try {
    res.url = await TUrl.shorten(URI);
  } catch (error) {
    res.err = true;
    console.warn('Error in urlShortener:', error);
  }
  return res;
}

module.exports = {
  fetchData,
  fullUrl,
  getFullLink,
  getFullTemplate,
  urlShortener,
  urlShortener1,
};