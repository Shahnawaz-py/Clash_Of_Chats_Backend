const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createClan,
  getClans,
  getClanById,
  joinClan,
  leaveClan,
} = require('../controllers/clanController');

router.post('/', protect, createClan);
router.get('/', protect, getClans);
router.get('/:id', protect, getClanById);
router.post('/:id/join', protect, joinClan);
router.post('/:id/leave', protect, leaveClan);

module.exports = router;
