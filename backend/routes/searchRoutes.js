const express = require('express');
const { getSearchHistory, saveSearchHistory } = require('../controllers/searchController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);
router.get('/', getSearchHistory);
router.post('/', saveSearchHistory);

module.exports = router;
