const config = {
  admins: ['jdoe'],
  botAccount: 'bot@botaccount',
  botName: 'linkBOT',
  botPass: 'botPass',
  channels: ['#foo', '##bar'],
  maintainers: ['ssmith'],
  report: '!ADMIN',
  RQAPI:
    'https://en.wikinews.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:Review&format=json&cmsort=timestamp&cmprop=timestamp|ids|title',
  server: 'irc.freenode.net',
  shortURL:
    'https://meta.wikimedia.org/w/api.php?action=shortenurl&format=json&url=',
  URL: 'https://en.wikinews.org/w/index.php?title=',
  URAPI:
    'https://en.wikinews.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:Under%20review&format=json&cmsort=timestamp&cmprop=title',
};

module.exports = config;
