const irc = require('irc');
const fetch = require('node-fetch');
const _ = require('underscore');

const {
  admins,
  botName,
  botPass,
  channels,
  maintainers,
  report,
  RQAPI,
  server,
} = require('./config');

const {
  fetchData,
  fullUrl,
  getFullLink,
  getFullTemplate,
  urlShortener,
  urlShortener1,
} = require('./utils');

const { fallback, reset, short } = require('./promUrlShortener');

const client = new irc.Client(server, botName, {
  channels,
});

function pm(sender, msg) {
  client.say(sender, 'I am a bot.');
  if (msg.startsWith(report))
    admins.forEach((admin) =>
      client.say(admin, `Message from ${sender}: ${msg}`)
    );
}

function err(msg) {
  maintainers.forEach((maintainer) =>
    client.say(maintainer, `Error: ${JSON.stringify(msg)}`)
  );
}

async function announceRQ(sender, channel) {
  const data = await fetchData(RQAPI);
  if (data.error)
    client.say(
      channel,
      `Error occurred, ${sender}.  Try this instead: "[[CAT:REV]]"`
    );
  else {
    const { list } = data;
    if (!list.length) client.say(channel, `Review queue is empty, ${sender}.`);
    else {
      client.say(
        channel,
        `${list.length} articles to review, ${sender}.  They are:`
      );
      const titles = list.map(({ title }) => title);
      const urls = titles.map(fullUrl);
      client.say(channel, '(Hold on a sec...  Shortening the URLs.)');
      sayShortUrls(urls, channel, titles);
    }
  }
}

async function sayShortUrls(urlList, channel, titles = []) {
  const shortUrls = await Promise.all(urlList.map(short));
  if (titles.length == 0) {
    shortUrls.forEach(({ url, err }) => {
      if (!err) client.say(channel, url);
    });
  } else {
    shortUrls.forEach(({ url, err }, idx) => {
      if (!err) client.say(channel, `${url} -- ${titles[idx]}`);
    });
  }
}

function groupChat(sender, channel, msg) {
  const lcMsg = msg.toLowerCase();
  if (lcMsg.includes(`thanks ${botName}`))
    client.say(channel, `You are welcome, ${sender}.`);
  if (msg.includes(`${botName} !RQ`)) announceRQ(sender, channel);
  if (msg.includes(`${botName} !FB`)) fallback();
  if (msg.includes(`${botName} !TRY`)) reset();
  const regex1 = /\[{2}(.*?)\]{2}/g;
  const regex2 = /\{{2}(.*?)\}{2}/g;
  const links = msg.match(regex1);
  const templates = msg.match(regex2);
  if (links) {
    const nonEmptyLink = links.filter((el) => el.length > 4);
    const fullLinks = nonEmptyLink.map(getFullLink);
    if (fullLinks.length) sayShortUrls(fullLinks, channel);
  }
  if (!msg.endsWith('--nl') && templates) {
    const nonEmptyTl = templates.filter((el) => el.length > 4);
    const fullLinks = nonEmptyTl.map(getFullTemplate);
    if (fullLinks.length) sayShortUrls(fullLinks, channel);
  }
}

client.addListener('error', err);
client.addListener('pm', pm);
client.addListener('message', groupChat);

const submittedState = {
  announced: [],
};

async function announceSubmitted() {
  const res = await fetch(RQAPI);
  const parsed = await res.json();
  const titles = parsed.query.categorymembers.map((el) => el.title);
  // rm already announced
  const yetToAnnounce = _.without(titles, ...submittedState.announced);
  submittedState.announced.push(...yetToAnnounce);
  const prepped = yetToAnnounce.map(fullUrl);
  if (prepped.length) {
    channels.forEach((channel) => client.say(channel, 'Submitted for review:'));
    channels.forEach((channel) =>
      sayShortUrls(prepped, channel, yetToAnnounce)
    );
  }
}

const submittedPeriod = 5 * 60 * 1000;
const cacheClearPeriod = 6 * 60 * 60 * 1000;

setInterval(announceSubmitted, submittedPeriod);
setInterval(() => {
  submittedState.announced = [];
}, cacheClearPeriod);
