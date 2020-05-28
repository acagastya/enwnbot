const irc = require('irc');
const fetch = require('node-fetch');

const {
  admins,
  botName,
  channels,
  maintainers,
  report,
  RQAPI,
  server,
  shortURL,
  URL,
} = require('./config');

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

function handleLink(link, channel) {
  const len = link.length;
  const trimmed = link.substr(2, len - 4);
  let [main, anchor] = trimmed.split('#');
  main = main.replace(/ /g, '%20');
  if (anchor) anchor = anchor.replace(/ /g, '_');
  let final;
  if (anchor) final = `${main}#${anchor}`;
  else final = main;
  client.say(channel, `${URL}${final}`);
}

function handleTemplate(template, channel) {
  const len = template.length;
  const word = template
    .substr(2, len - 4)
    .split('|')[0]
    .replace(/ /g, '%20');
  client.say(channel, `${URL}Template:${word}`);
}

async function fetchData(URI) {
  const res = {};
  try {
    const data = await fetch(URI);
    const parsed = await data.json();
    res.list = parsed.query.categorymembers;
  } catch (error) {
    res.error = true;
  }
  return res;
}

async function urlShortener(URI) {
  const req = `${shortURL}${URI}`;
  const res = {};
  try {
    const data = await fetch(req, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const parsed = await data.json();
    res.url = parsed.shortenurl.shorturl;
  } catch (error) {
    res.err = true;
  }
  return res;
}

async function announceRQ(from, channel) {
  const data = await fetchData(RQAPI);
  if (data.error)
    client.say(
      channel,
      `Error occurred, ${from}.  Try this instead: "[[CAT:REV]]"`
    );
  else {
    const { list } = data;
    if (!list.length) client.say(channel, `Review queue is empty, ${from}.`);
    else {
      client.say(
        channel,
        `${list.length} articles to review, ${from}.  They are:`
      );
      const urls = list.map(({ title }) => {
        const fmtTitle = title.replace(/ /g, '%20');
        return `${URL}${fmtTitle}`;
      });
      const shortUrls = await Promise.all(urls.map(urlShortener));
      shortUrls.forEach(({ url }) => {
        client.say(channel, url);
      });
    }
  }
}

function groupChat(from, to, msg) {
  const lcMsg = msg.toLowerCase();
  if (lcMsg.includes(`thanks ${botName}`))
    client.say(to, `You are welcome, ${from}.`);
  if (msg.includes(`${botName} /RQ`)) announceRQ(from, to);
  const regex1 = /\[{2}(.*?)\]{2}/g;
  const regex2 = /\{{2}(.*?)\}{2}/g;
  const links = msg.match(regex1);
  const templates = msg.match(regex2);
  links && links.forEach((link) => handleLink(link, to));
  templates &&
    !msg.endsWith('--nl') &&
    templates.forEach((template) => handleTemplate(template, to));
}

client.addListener('error', err);
client.addListener('pm', pm);
client.addListener('message', groupChat);
