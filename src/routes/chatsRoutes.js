const express = require('express');
const router = express.Router();
const chatsController = require('../controllers/chatsController'); // Ensure the path is correct

router.get('/conversations', chatsController.getConversations);
router.get('/messages/:chatId', chatsController.getMessages);

module.exports = router;
