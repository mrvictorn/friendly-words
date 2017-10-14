const mongoose = require('mongoose');
const Promise = require('bluebird');

(async () => {
  try {
    mongoose.Promise = Promise;
    await mongoose.connect('mongodb://localhost/fwc', { useMongoClient: true });
  } catch (e) {
    throw e;
  }
})();

module.exports = mongoose;
