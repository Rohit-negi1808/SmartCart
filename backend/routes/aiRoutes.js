const express = require('express');
const { aiSearch, explainMatch, aiCompare } = require('../controllers/aiController');
const { optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// AI search works for guests too, but personalizes/saves history when logged in.
router.post('/search', optionalAuth, aiSearch);
router.post('/explain', explainMatch);
router.post('/compare', aiCompare);

module.exports = router;
