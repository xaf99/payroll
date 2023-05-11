const Rooms = require('../models/roomModel');
const Chat = require('../models/chatModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const chatMessages = async (limit, skip, room, userId) => {
  if (!room) return { finalMessages: [], messages: [] };

  let finalMessages = [];

  if (!room) return next(new AppError('Params are missing', 400));

  const msg = await Chat.find({
    room,
    $or: [{ to: userId }, { from: userId }],
  })
    .populate('to', 'firstName lastName contactPerson photo')
    .populate('from', 'firstName lastName contactPerson photo')
    .select('message to from -_id createdAt updatedAt')
    .sort('-createdAt')
    .skip(skip)
    .limit(limit)
    .len();

  if (msg.length > 0) {
    msg.forEach((item) => {
      item.message.createdAt = item.createdAt;
      finalMessages.push(item.message);
    });
  }

  return { finalMessages, messages: msg };
};
exports.chatMessages = chatMessages;

exports.getAllChatRooms = async (req, res, next) => {
  const userId = req.user.id;

  const chatRooms = await Rooms.find({
    $or: [{ user1: userId }, { user2: userId }],
  })
    .populate('user1')
    .populate('user2')
    .sort('-updatedAt');
  // const chatRooms = await Rooms.find({ user1: userId,user2: userId, });

  res.status(200).json({
    status: 'success',
    data: chatRooms,
  });
};

exports.sendNewMsg = catchAsync(async (req, res, next) => {
  const { to, from, message, listing } = req.body;
  if (!to || !from) return next(new AppError('Params are missing', 400));
  let checkRoomId = await Rooms.findOne({
    $or: [
      { user1: to, user2: from },
      { user1: from, user2: to },
    ],
  });

  if (!checkRoomId) {
    checkRoomId = await Rooms.create({
      user1: to,
      user2: from,
      user1UnreadCount: 1,
      ...(listing && { listing }),
      lastMessage: message,
      lastChatted: Date.now(),
    });
  } else {
    await Rooms.findByIdAndUpdate(checkRoomId._id, {
      lastMessage: message,
      ...(listing && { listing }),
      lastChatted: Date.now(),
    });
  }
  req.body.room = checkRoomId._id;
  let msg = await Chat.create(req.body);

  res.status(201).json({
    status: 'success',
    data: msg,
  });
});

exports.getAllMsg = catchAsync(async (req, res, next) => {
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 30;
  const skip = (page - 1) * limit;
  const { room } = req.query;
  const { user } = req;

  let finalMessages = [];

  if (!room) next(new AppError('room is empty.', 400));

  const chats = await Chat.find({
    room,
    $or: [{ to: user._id }, { from: user._id }],
  })
    .select(
      'room to from message isReadMessage createdAt isDeliveredMessage -_id'
    )
    .sort('-createdAt')
    .skip(skip)
    .limit(limit)
    .lean();

  if (chats.length > 0) {
    chats.forEach((item) => {
      item.message.createdAt = item.createdAt;
      finalMessages.push(item.message);
    });
  }

  res.status(200).json({
    status: 'success',
    results: finalMessages.length,
    data: finalMessages,
  });
});

/* 

  io.getIO().emit('posts', {
    action: 'create',
    post: { ...post._doc, creator: { _id: req.userId, name: user.name } }
  });
    
*/
