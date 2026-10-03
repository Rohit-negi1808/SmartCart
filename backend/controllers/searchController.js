const SearchHistory = require('../models/SearchHistory');

// @route GET /api/search-history
const getSearchHistory = async (req, res, next) => {
  try {
    const history = await SearchHistory.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, message: 'Search history fetched successfully', data: history });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/search-history
// Mainly useful if the frontend ever needs to log a search explicitly;
// /api/ai/search already saves history automatically for logged-in users.
const saveSearchHistory = async (req, res, next) => {
  try {
    const { query, extractedRequirements, resultCount } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: 'query is required' });
    }
    const entry = await SearchHistory.create({
      user: req.user._id,
      query,
      extractedRequirements: extractedRequirements || {},
      resultCount: resultCount || 0,
    });
    res.status(201).json({ success: true, message: 'Search history saved', data: entry });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSearchHistory, saveSearchHistory };
