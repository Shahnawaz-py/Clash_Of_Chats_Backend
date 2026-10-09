const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  removeFriend,
} = require('../controllers/friendController');

router.post('/request', protect, sendFriendRequest);
router.get('/requests', protect, getFriendRequests);
router.post('/accept/:requestId', protect, acceptFriendRequest);
router.post('/reject/:requestId', protect, rejectFriendRequest);
router.get('/', protect, getFriends);
router.delete('/:friendId', protect, removeFriend);
router.post('/remove/:friendId', protect, removeFriend);


module.exports = router;
