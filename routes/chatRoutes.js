const express = require('express');
const {
  getAllChatRooms,
  getAllMsg,
  sendNewMsg,
} = require('../controllers/chatController');
const { protect, restrictTo } = require('../controllers/authController');

const router = express.Router();
router.use(protect);

// getting all messags og a chat
router.route('/single-chat').get(getAllMsg);

// getting all chat rooms
router.route('/rooms').get(getAllChatRooms);

// send message to user
router.route('/send-message').post(sendNewMsg);

module.exports = router;
