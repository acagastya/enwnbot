const irc = require('irc');

const {
  admins,
  botName,
  channels,
  maintainers,
  report,
  server,
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

function groupChat(from, to, msg) {
  if (msg.toLowerCase().includes(`thanks ${botName}`))
    client.say(to, `You are welcome, ${from}.`);
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
// channels.forEach(client.join);
