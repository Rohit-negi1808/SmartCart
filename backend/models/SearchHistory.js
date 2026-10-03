const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    query: { type: String, required: true },
    extractedRequirements: { type: mongoose.Schema.Types.Mixed, default: {} },
    resultCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
