const TUrl = require('tinyurl');
const { promisify } = require('util');
const R = require('request').defaults({ jar: true });

const { botAccount, botPass } = require('./config');

const request = promisify(R);
const get = promisify(R.get);
const post = promisify(R.post);

const url = 'https://meta.wikimedia.org/w/api.php';
const globalState = {
  mainExecuted: false,
};

let logintoken;
let csrfToken;

async function getLoginToken() {
  const res = {};
  try {
    const data = await get({
      url,
      qs: {
        action: 'query',
        meta: 'tokens',
        type: 'login',
        format: 'json',
      },
    });
    const { body } = data;
    const parsed = JSON.parse(body);
    res.logintoken = parsed.query.tokens.logintoken;
  } catch (error) {
    console.log(error);
    res.error = error;
    globalState.error = true;
    globalState.fallback = true;
  }
  return res;
}

async function loginRequest(TOKEN) {
  const res = {};
  try {
    const data = await post({
      url,
      form: {
        action: 'login',
        lgname: botAccount,
        lgpassword: botPass,
        lgtoken: TOKEN,
        format: 'json',
      },
    });
    const { body } = data;
    const parsed = JSON.parse(body);
    const result = parsed.login.result;
    if (result != 'Success') {
      globalState.error = parsed.login.reason;
      res.error = parsed.login.reason;
    } else res.result = result;
  } catch (error) {
    console.log(error);
    globalState.error = error;
    res.error = error;
  }
  return res;
}

async function getCsrfToken() {
  const res = {};
  try {
    const data = await get({
      url,
      qs: {
        action: 'query',
        meta: 'tokens',
        format: 'json',
      },
    });
    const { body } = data;
    const parsed = JSON.parse(body);
    res.csrfToken = parsed.query.tokens.csrftoken;
  } catch (error) {
    res.error = error;
    globalState.useFallback = true;
  }
  return res;
}

async function main() {
  try {
    const maybeLoginToken = await getLoginToken();
    if (maybeLoginToken.error) globalState.useFallback = true;
    else {
      logintoken = maybeLoginToken.logintoken;
      const maybeSuccess = await loginRequest(logintoken);
      if (maybeSuccess.error) globalState.useFallback = true;
      else {
        const maybeCsrfToken = await getCsrfToken();
        if (maybeCsrfToken.error) globalState.useFallback = true;
        else csrfToken = maybeCsrfToken.csrfToken;
      }
    }
  } catch (error) {
    console.error(error);
    globalState.useFallback = true;
  }
  globalState.mainExecuted = true;
}

main();

async function short(URI) {
  console.log(globalState, botAccount, botPass);
  if (!globalState.mainExecuted) main();
  if (!URI)
    URI =
      'https://en.wikinews.org/wiki/Astronomer_tells_Wikinews_about_discovery_of_closest_black_hole_known_so_far';
  const res = {};
  if (!globalState.error && !globalState.useFallback) {
    try {
      const data = await post({
        url,
        form: {
          action: 'shortenurl',
          url: URI,
          format: 'json',
        },
      });
      const { body } = data;
      const parsed = JSON.parse(body);
      res.url = parsed.shortenurl.shorturl;
    } catch (error) {
      globalState.error = error;
      res.error = error;
    }
  } else {
    try {
      res.url = await TUrl.shorten(URI);
    } catch (error) {
      res.error = error;
      console.error(error);
    }
  }
  return res;
}

function fallback() {
  globalState.useFallback = true;
}

function reset() {
  globalState.mainExecuted = false;
  globalState.error = false;
  globalState.useFallback = false;
}

module.exports = { fallback, reset, short };
