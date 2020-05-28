const config = {
  admins: ['jdoe'],
  botName: 'linkBOT',
  botPass: 'botPass',
  channels: ['#foo', '##bar'],
  maintainers: ['ssmith'],
  report: '!ADMIN',
  RQAPI:
    'https://en.wikinews.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:Review&format=json',
  server: 'irc.freenode.net',
  shortURL:
    'https://meta.wikimedia.org/w/api.php?action=shortenurl&format=json&url=',
  URL: 'https://en.wikinews.org/w/index.php?title=',
};

module.exports = config;
