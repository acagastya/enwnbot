const irc = require('irc');
const fetch = require('node-fetch');
const moment = require('moment-timezone');

const {
  admins,
  botName,
  channels,
  maintainers,
  report,
  RQAPI,
  server,
  URAPI,
} = require('./config');

const {
  fetchData,
  fullUrl,
  getFullLink,
  getFullTemplate,
  sayTime,
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
      const times = list.map(({ timestamp }) => moment().to(moment(timestamp)));
      const urls = titles.map(fullUrl);
      client.say(channel, '(Hold on a sec...  Shortening the URLs.)');
      sayShortUrls(urls, channel, titles, times);
    }
  }
}

async function sayShortUrls(
  urlList,
  channel,
  titles = [],
  times = [],
  pending = []
) {
  const shortUrls = await Promise.all(urlList.map(short));

  shortUrls.forEach(({ url, err }, idx) => {
    if (!err) {
      let msg = `${url} sumbitted for review`;
      if (times.length) msg += ` *${times[idx]}*`;
      if (titles.length) msg += ` -- ${titles[idx]}`;
      if (pending[idx]) msg += ' *under review*';
      client.say(channel, msg);
    } else console.log(err);
  });
}

function groupChat(sender, channel, msg) {
  const lcMsg = msg.toLowerCase();
  if (lcMsg.includes(`thanks ${botName}`))
    client.say(channel, `You are welcome, ${sender}.`);
  if (msg.includes(`${botName} !RQ`)) announceRQ(sender, channel);
  if (msg.includes(`${botName} !FB`)) fallback();
  if (msg.includes(`${botName} !TRY`)) reset();
  if (msg.includes(`${botName} !time`)) sayTime(msg, client, channel);
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

  const underReview = await fetch(URAPI);
  const urParsed = await underReview.json();
  const urTitles = urParsed.query.categorymembers.map(({ title }) => title);

  const titleTime = parsed.query.categorymembers.map(({ title, timestamp }) => {
    return { timestamp, title };
  });
  const allTitles = parsed.query.categorymembers.map(({ title }) => title);
  const pending = titleTime.filter(
    ({ title }) => !submittedState.announced.includes(title)
  );
  const pendingRev = pending.map((el) => urTitles.includes(el.title));
  const titles = pending.map(({ title }) => title);
  submittedState.announced = [...allTitles];
  const urls = titles.map(fullUrl);
  const times = pending.map(({ timestamp }) => moment().to(moment(timestamp)));

  if (urls.length) {
    channels.forEach((channel) => client.say(channel, 'Review Queue:'));
    channels.forEach((channel) =>
      sayShortUrls(urls, channel, titles, times, pendingRev)
    );
  }
}

const submittedPeriod = 5 * 60 * 1000;
const cacheClearPeriod = 6 * 60 * 60 * 1000;

setInterval(announceSubmitted, submittedPeriod);
setInterval(() => {
  submittedState.announced = [];
}, cacheClearPeriod);
