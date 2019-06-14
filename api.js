const Twit = require("twit");

const { getNewestTweetFrom } = require("./database");

const config = {
  twitter: {
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
  }
};
const T = new Twit(config.twitter);

async function getUserTweetsBefore(username, max_id, tweets = []) {
  const { data } = await T.get("statuses/user_timeline", {
    screen_name: username,
    count: 200,
    exclude_replies: false,
    tweet_mode: "extended",
    max_id
  });
  const newTweets = data.filter(tweet => tweet.id_str !== max_id);
  if (newTweets.length) {
    const oldest = newTweets[newTweets.length - 1].id_str;
    console.log(
      `${username}: Caught ${newTweets.length} tweets older than ${max_id}.`
    );
    return getUserTweetsBefore(username, oldest, [...tweets, ...newTweets]);
  } else {
    return tweets;
  }
}

async function getUserTweetsSince(username, since_id, tweets = []) {
  const { data } = await T.get("statuses/user_timeline", {
    screen_name: username,
    count: 200,
    exclude_replies: false,
    tweet_mode: "extended",
    since_id
  });
  if (data.length) {
    const newest = data[0].id_str;
    console.log(
      `${username}: Caught ${data.length} tweets newer than ${since_id}.`
    );
    return getUserTweetsSince(username, newest, [...data, ...tweets]);
  } else {
    return tweets;
  }
}

async function getUserTweets(username) {
  const newest = await getNewestTweetFrom(username);
  if (!newest) {
    return getUserTweetsBefore(username);
  } else {
    return getUserTweetsSince(username, newest);
  }
}

module.exports = {
  getUserTweets
};
