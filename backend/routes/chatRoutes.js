const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  startOrGetConversation,
  getMyConversations,
  getMessages,
  sendMessage,
} = require('../controllers/chatController');

// All chat routes require authentication
router.use(protect);

router.post('/conversations', startOrGetConversation);
router.get('/conversations', getMyConversations);
router.get('/conversations/:id/messages', getMessages);
router.post('/conversations/:id/messages', sendMessage);

module.exports = router;
