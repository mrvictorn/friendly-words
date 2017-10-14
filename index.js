const fs = require('fs');
const { Transform } = require('stream');
const RLStream = require('readline-stream');
const BatchStream = require('batch-stream');
const EncodedWords = require('./model');
const through = require('through');

function encoder(word) {
  const dictionary = {};
  let dictIdx = 1;
  let result = '';
  let symbol;
  for (let i = word.length - 1; i > -1; i -= 1) {
    symbol = word[i];
    let coded = dictionary[symbol];
    if (!coded) {
      coded = dictionary[symbol] = dictIdx++;
    }
    result += (10 + coded);
  }
  return result;
}

let wordCount = 0;

class EncoderStream extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  _transform(word, enc, cb) {
    //console.log(++wordCount);
    const fixed = word.trim();
    cb(null, { word: fixed, encoded: encoder(fixed) });
  }
}

function DBStream() {
  return through(async function (data) {
    const stream = this;
    EncodedWords.collection.insertMany(data, (err, res) => {
      if (err) {
        stream.emit('error', err)
      } else {
        stream.emit('data', data);
      }
    });
  });
}


function processFile(filename, cb) {
  const input = fs.createReadStream(filename, 'utf8');
  const reader = new RLStream({});
  const encoder = new EncoderStream();
  const batcher = new BatchStream({ size: 1000 });
  const storage = DBStream();
  input.pipe(reader);
  reader.pipe(encoder);
  encoder.pipe(batcher);
  batcher.pipe(storage);
  storage.on('end', () => cb());
  storage.on('error', e => console.log(e));
}

EncodedWords.collection.drop();

function getResult() {
  return EncodedWords.collection.aggregate(
    // Pipeline
    [
      // Stage 1
      {
        $group: {
          _id: '$encoded', count: {$sum: 1}
        }
      },
      {
        $match: {
          "count": {$gt:1}
        }
      },
      {
        $group: {
          _id: null, countAll: {$sum: "$count"}
        }
      },
    ]
  );
}

var start = process.hrtime();
processFile('./words.txt', async () => {
  const res = await getResult();
  console.log(await res.toArray());
  console.log("Finished in: " + process.hrtime(start)[0] + ' sec');
  process.exit();
});

// (async function () {
//   const res = await getResult();
//   console.log(await res.toArray());
// })();