const fs = require("fs");

const Markov = require("./markov-strings").default;

const START_SENTINEL = "__START";
const END_SENTINEL = "__END";
const STARTLENGTH = START_SENTINEL.length + 1;
const ENDLENGTH = END_SENTINEL.length + 1;

function trimText(text) {
  return text.slice(STARTLENGTH, -ENDLENGTH);
}

function sanitizeText(text, opts = {}) {
  const defaultOpts = { screenNameWhitelist: [] };
  const { screenNameWhitelist } = { ...defaultOpts, ...opts };
  let words = text
    .replace(/\&amp\;/gi, "&")
    .split(" ")
    .filter(
      word =>
        !word.startsWith("@") ||
        screenNameWhitelist.includes(word.toLowerCase().slice(1))
    )
    .filter(
      word =>
        !word.match(
          /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi
        )
    )
    .join(" ")
    .replace(/([\.,:;!\+&]+)/gi, " $1 ")
    .replace(/\s+/gi, " ")
    .split(" ")
    .filter(word => !!word)
    .join(" ")
    .replace(/ ([\.,:;!\+&]+)/gi, "$1");
  return `${START_SENTINEL} ${words} ${END_SENTINEL}`;
}

function buildCorpus(chain, data) {
  chain.buildCorpus(data);
  fs.writeFileSync("./.data/corpus.json", JSON.stringify(chain.corpus));
  fs.writeFileSync("./.data/start.json", JSON.stringify(chain.startWords));
  fs.writeFileSync("./.data/end.json", JSON.stringify(chain.endWords));
}

function readCorpus() {
  const corpus = fs.readFileSync("./.data/corpus.json");
  const startWords = fs.readFileSync("./.data/start.json");
  const endWords = fs.readFileSync("./.data/end.json");
  return {
    corpus: JSON.parse(corpus),
    startWords: JSON.parse(startWords),
    endWords: JSON.parse(endWords)
  };
}

function createCorpus(data) {
  const chain = new Markov(data, { stateSize: 2 });
  try {
    const { corpus, startWords, endWords } = readCorpus();
    chain.corpus = corpus;
    chain.startWords = startWords;
    chain.endWords = endWords;
  } catch (e) {
    console.error("No offline corpus available");
  }
  buildCorpus(chain, data);
  return chain;
}

function generateText(chain, score) {
  const options = {
    maxTries: 10000,
    filter: result => {
      return (
        result.score > score &&
        result.string.split(" ").length >= 5 &&
        result.string.length < 280 + STARTLENGTH + ENDLENGTH
      );
    }
  };

  const result = chain.generate(options);
  console.log(result);
  return trimText(result.string);
}

const chain = createCorpus([]);

module.exports = {
  sanitizeText,
  chain,
  buildCorpus,
  trimText,
  generateText
};
