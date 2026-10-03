const express = require('express');
const { chat } = require('../controllers/chatController');

const router = express.Router();

// The chatbot is intentionally open to guests too (like AI search) - it's
// a discovery/education tool, not an account feature.
router.post('/', chat);

module.exports = router;
