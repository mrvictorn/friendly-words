const mongoose = require('./mongoose');

const SchemaEncodedWords = new mongoose.Schema({
  word: String,
  encoded: String
});

module.exports = mongoose.model('EncodedWords', SchemaEncodedWords);