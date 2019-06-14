const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

const dbFile = "./.data/sqlite.db";

const doesDbExist = fs.existsSync(dbFile);
const db = new sqlite3.Database(dbFile);

function initDB() {
  if (!doesDbExist) {
    create();
    console.log("Database created.");
  } else {
    console.log("Database ready.");
  }
  return db;
}

function create() {
  const createTweetsTable = `CREATE TABLE IF NOT EXISTS Tweets 
  (
    id_str TEXT NOT NULL,
    text TEXT,
    actor TEXT,
    co_actor TEXT,
    action TEXT,
    created_at TEXT,
    raw TEXT,
    PRIMARY KEY (id_str)
  )
  `;
  db.run(createTweetsTable);
}

function drop() {
  const dropTweetsTable = `DROP TABLE Tweets`;
  db.run(dropTweetsTable);
}

async function getAllText() {
  const statement = `SELECT text FROM Tweets`;
  return new Promise(resolve => {
    const texts = [];
    db.each(
      statement,
      (error, row) => {
        if (error) {
          throw error;
        }
        texts.push(row.text);
      },
      (error, rows) => {
        if (error) {
          throw error;
        }
        resolve(texts);
      }
    );
  });
}

async function saveTweets(tweets) {
  return new Promise(resolve => {
    db.serialize(() => {
      const statement = db.prepare(
        `INSERT OR REPLACE INTO Tweets (id_str, text, actor, co_actor, action, created_at, raw) VALUES (
          COALESCE((SELECT id_str FROM Tweets WHERE id_str = ?1), ?1),
          COALESCE((SELECT text FROM Tweets WHERE id_str = ?1), ?2),
          COALESCE((SELECT actor FROM Tweets WHERE id_str = ?1), ?3),
          COALESCE((SELECT co_actor FROM Tweets WHERE id_str = ?1), ?4),
          COALESCE((SELECT action FROM Tweets WHERE id_str = ?1), ?5),
          COALESCE((SELECT created_at FROM Tweets WHERE id_str = ?1), ?6),
          COALESCE((SELECT raw FROM Tweets WHERE id_str = ?1), ?7)
        )`
      );
      for (let tweet of tweets) {
        const {
          id_str,
          text,
          actor,
          co_actor,
          action,
          created_at,
          raw
        } = tweet;
        statement.run([id_str, text, actor, co_actor, action, created_at, raw]);
      }
      resolve();
    });
  });
}

async function getNewestTweetFrom(username) {
  return new Promise(resolve => {
    const statement = db.prepare(
      `SELECT id_str FROM Tweets WHERE actor LIKE ? ORDER BY created_at DESC LIMIT 1`
    );
    statement.all([username], (error, rows) => {
      if (error) {
        throw error;
      }
      resolve((rows[0] && rows[0].id_str) || null);
    });
  });
}

module.exports = {
  db,
  initDB,
  create,
  drop,
  getAllText,
  getNewestTweetFrom,
  saveTweets
};
