const TYPES = Object.freeze({
  tweet: "tweet",
  retweet: "retweet",
  quote: "quote",
  reply: "reply"
});

const AUTOMATED_SOURCES = ["TweetDeck", "SocialPilot.co"];

const isRetweet = tweet => !!tweet.retweeted_status;

const isQuoteTweet = tweet => !!tweet.is_quote_status;

const isReplyTweet = tweet => !!tweet.in_reply_to_screen_name;

const isNormalTweet = tweet =>
  !isRetweet(tweet) && !isQuoteTweet(tweet) && !isReplyTweet(tweet);

const createPermalink = (screen_name, id_str) =>
  `https://twitter.com/${screen_name}/status/${id_str}`;

const getSource = tweet => tweet.source.split(">")[1].split("<")[0];

const isAutomatedSource = tweet => AUTOMATED_SOURCES.includes(getSource(tweet));

const getScreenNameFromPermalink = (permalink = "") =>
  permalink.split(".com/")[1].split("/status")[0];

const getSummary = tweet => {
  let type = TYPES.tweet;
  let coActor = undefined;
  const actor = tweet.user.screen_name;
  if (isRetweet(tweet)) {
    type = TYPES.retweet;
    coActor = tweet.retweeted_status.user.screen_name;
  } else if (isQuoteTweet(tweet)) {
    type = TYPES.quote;
    coActor =
      (tweet.quoted_status && tweet.quoted_status.user.screen_name) ||
      (tweet.quoted_status_permalink &&
        tweet.quoted_status_permalink.expanded.includes(".com/") &&
        getScreenNameFromPermalink(tweet.quoted_status_permalink.expanded)) ||
      null;
  } else if (isReplyTweet(tweet)) {
    type = TYPES.reply;
    coActor = tweet.in_reply_to_screen_name;
  }
  return {
    type,
    actor,
    coActor
  };
};

const getTweetText = tweet => {
  return isRetweet(tweet)
    ? getTweetText(tweet.retweeted_status)
    : tweet.full_text;
};

const getCreatedDate = tweet => {
  const [, monthShort, date, time, zone, year] = tweet.created_at.split(" ");
  return new Date(`${monthShort} ${date}, ${year} ${time}${zone}`);
};

module.exports = {
  TYPES,
  isRetweet,
  isQuoteTweet,
  isReplyTweet,
  isNormalTweet,
  createPermalink,
  getSource,
  getSummary,
  isAutomatedSource,
  getTweetText,
  getCreatedDate
};
