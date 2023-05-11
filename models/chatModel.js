const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.ObjectId,
      ref: 'Room',
      required: true,
    },
    to: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    from: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    message: {
      type: Object,
      required: true,
    },
    isReadMessage: {
      type: Number,
      required: false,
    },
    isDeliveredMessage: {
      type: Boolean,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
