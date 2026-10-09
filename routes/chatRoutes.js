const express = require('express');
const router = express.Router();
const {
  getConversations,
  createOrGetConversation,
  getOrCreateClanConversation,
  getMessages,
  sendMessage,
  markAsRead,
  editMessage,
  deleteMessage,
  broadcastWarHorn,
  reactMessage,
} = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/conversations', protect, getConversations);
router.post('/conversations', protect, createOrGetConversation);
router.get('/clan-conversation/:clanId', protect, getOrCreateClanConversation);
router.get('/messages/:conversationId', protect, getMessages);
router.post('/messages', protect, sendMessage);
router.post('/warhorn', protect, broadcastWarHorn);
router.put('/messages/:id', protect, editMessage);
router.put('/messages/:id/react', protect, reactMessage);
router.delete('/messages/:id', protect, deleteMessage);
router.put('/read/:conversationId', protect, markAsRead);

module.exports = router;
