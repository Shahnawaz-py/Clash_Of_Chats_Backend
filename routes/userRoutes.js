const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateUserProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getUsers);
router.put('/profile', protect, updateUserProfile);
router.get('/:id', protect, getUserById);

module.exports = router;
