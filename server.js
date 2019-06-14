require("dotenv").config();

const express = require("express");
const passport = require("passport");
const Strategy = require("passport-twitter").Strategy;

const {
  getTweetText,
  isRetweet,
  getSummary,
  getCreatedDate
} = require("./tweets");
const { initDB, saveTweets } = require("./database");
const { getUserTweets } = require("./api");
const { chain, buildCorpus, sanitizeText, trimText, generateText } = require("./markov");

const app = express();
const db = initDB();

passport.use(
  new Strategy(
    {
      consumerKey: process.env.CONSUMER_KEY,
      consumerSecret: process.env.CONSUMER_SECRET,
      callbackURL: process.env.BOT_CALLBACK
    },
    function(token, tokenSecret, profile, cb) {
      console.log({ token, tokenSecret });
      return cb(null, profile);
    }
  )
);

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

app.all(`/${process.env.BOT_ENDPOINT}`, async (req, res) => {
  const result = generateText(chain, 100);
  res.json({ result });
});

app.get("/scrape", async function(req, res) {
  const usernames = process.env.USERNAMES.split(",");
  res.json({
    usernames
  });
  for (let username of usernames) {
    try {
      const tweets = await getUserTweets(username);
      const data = tweets
        .filter(tweet => !isRetweet(tweet))
        .map(tweet => {
          const { id_str } = tweet;
          const raw = getTweetText(tweet);
          const text = sanitizeText(raw, {
            screenNameWhitelist: usernames
          });
          const { type: action, actor, coActor: co_actor } = getSummary(tweet);
          const created_at = getCreatedDate(tweet).toISOString();
          return {
            id_str,
            text,
            actor,
            action,
            co_actor,
            created_at,
            raw
          };
        });
      db.serialize();
      await saveTweets(data);
      buildCorpus(chain, data.map(d => d.text));
      db.parallelize();
    } catch (error) {
      console.error({ error, username });
    }
  }
});

const listener = app.listen(process.env.PORT, function() {
  console.log("Your bot is running on port " + listener.address().port);
});
