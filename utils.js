const fetch = require("node-fetch");
const { allowedSetters, setterAdmins, URL } = require("./config");
const TUrl = require("tinyurl");
const moment = require("moment-timezone");
const timezones = require("./time");

async function fetchData(URI) {
  const res = {};
  try {
    const data = await fetch(URI);
    const parsed = await data.json();
    res.list = parsed.query.categorymembers;
  } catch (error) {
    res.error = true;
    console.warn("Error in fetchData:", error);
  }
  return res;
}

function fullUrl(title) {
  title = title.replace(/\?/g, "%3F");
  let [main, anchor] = title.split("#");
  main = main.replace(/ /g, "%20");
  if (anchor) anchor = anchor.replace(/ /g, "_");
  let final;
  if (anchor) final = `${main}%23${anchor}`;
  else final = main;
  return `${URL}${final}`;
}

function getFullLink(link) {
  const len = link.length;
  const trimmed = link.substr(2, len - 4).replace(/\?/g, "%3F");
  const finalUrl = fullUrl(trimmed);
  return finalUrl;
}

function getFullTemplate(template) {
  const len = template.length;
  const word = template
    .substr(2, len - 4)
    .split("|")[0]
    .replace(/ /g, "%20")
    .replave(/\?/g, "%3F");
  return `${URL}Template:${word}`;
}

function sayTime(msg, client, channel) {
  let arr = msg.split(" ").filter(Boolean);
  while (arr[1] != "!time") arr.shift();
  const user = arr[2];
  const timezone = timezones.get(user) || user;
  const TZ = moment.tz.names().includes(timezone) ? timezone : "UTC";
  let time = moment()
    .tz(timezone)
    .format("HH:mm MMM DD");
  if (TZ == "UTC") time += " UTC";
  client.say(channel, time);
}

const chatSetter = {};

function setthis(sender, channel, msg, client) {
  if (!allowedSetters.includes(sender)) {
    client.say(channel, `You are not permitted to access this, ${sender}.`);
    return;
  }
  let arr = msg.split(" ").filter(Boolean);
  while (arr[1] != "!SET") arr.shift();
  const action = arr[2];
  switch (action) {
    case "help": {
      client.say(
        channel,
        `${sender}: These are the commands you can use: add, get, keys, rmv, clr, mt(?).`
      );
      break;
    }
    case "add": {
      if (chatSetter[channel] == undefined) chatSetter[channel] = {};
      if (chatSetter[channel][sender] == undefined)
        chatSetter[channel][sender] = new Map();
      const val = arr.slice(4).join(" ");
      chatSetter[channel][sender].set(arr[3], val);
      client.say(channel, `Added, ${sender}.`);
      break;
    }
    case "get": {
      if (chatSetter[channel] == undefined) chatSetter[channel] = {};
      if (chatSetter[channel][sender] == undefined)
        chatSetter[channel][sender] = new Map();
      const val = chatSetter[channel][sender].get(arr[3]);
      client.say(channel, `${sender}: ${val}`);
      break;
    }
    case "keys": {
      if (chatSetter[channel] == undefined) chatSetter[channel] = {};
      if (chatSetter[channel][sender] == undefined)
        chatSetter[channel][sender] = new Map();
      const keys = [];
      for (let key of chatSetter[channel][sender].keys()) keys.push(key);
      client.say(channel, `${sender}: ${keys.join(", ")}`);
      break;
    }
    case "rmv": {
      if (chatSetter[channel] == undefined) chatSetter[channel] = {};
      if (chatSetter[channel][sender] == undefined)
        chatSetter[channel][sender] = new Map();
      chatSetter[channel][sender].delete(arr[3]);
      client.say(channel, `${sender}: removed`);
      break;
    }
    case "clr": {
      if (chatSetter[channel] == undefined) chatSetter[channel] = {};
      chatSetter[channel][sender].clear();
      client.say(channel, `${sender}: deleted all sets.`);
      break;
    }
    case "mt": {
      if (!setterAdmins.includes(sender) || !chatSetter[channel]) {
        break;
      }
      Object.keys(chatSetter[channel]).forEach(name =>
        chatSetter[channel][name].clear()
      );
      client.say(channel, `Cleared all sets for everyone, ${sender}.`);
      break;
    }
    default: {
      client.say(channel, `Action: ${action} not found, ${sender}.`);
    }
  }
}

module.exports = {
  fetchData,
  fullUrl,
  getFullLink,
  getFullTemplate,
  sayTime,
  setthis
};
