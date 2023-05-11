const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    user: { type: Object },
  },
  {
    timestamps: true,
  }
);

const RoomSchema = new mongoose.Schema(
  {
    user1: { // always hr
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    user2: { // always employee
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    user1UnreadCount: {
      type: Number,
      default: 0,
    },
    user2UnreadCount: {
      type: Number,
      default: 0,
    },
    lastMessage: { type: messageSchema, default: null },
    lastChatted: {
      type: Date,
      default: Date.now(),
    },
  },
  { timestamps: true }
);

const Rooms = mongoose.model('Room', RoomSchema);

module.exports = Rooms;
