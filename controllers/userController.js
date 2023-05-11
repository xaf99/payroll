const User = require('../models/userModel');
const ObjectId = require('mongoose').Types.ObjectId;
const Category = require('../models/mailModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('../controllers/handlerFactory');
const AppError = require('../utils/appError');
const { filterObj } = require('../utils/fn');
const Email = require('../utils/email');
const { createNotification } = require('../controllers/notificationController');
const { deleteFile } = require('../utils/s3');
const moment = require('moment');
const Rooms = require('../models/roomModel');
const crypto = require('crypto');
const orderId = `oid_${crypto.randomBytes(3).toString('hex')}`;

const notificationHandler = async (
  sender,
  receiver,
  message,
  forr,
  notfTitle,
  fcmToken
) => {
  await createNotification(
    { title: notfTitle, fcmToken },
    {
      sender,
      receiver,
      message,
      for: forr,
      title: notfTitle,
    }
  );
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.verifyMe = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  await User.findOneAndUpdate({ _id: id }, { isVerified: true }).select(
    'isVerified'
  );

  res.render('emailVerified');
});

exports.updateMe = catchAsync(async (req, res, next) => {
  const files = req.files;
  const { _id } = req.user;
  let updatedUser;
  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(
    req.body,
    'firstName',
    'lastName',
    'userName'
  );

  console.log("files",files)

  if (files?.photo) {
    // if (req.user.photo != 'default.png') await deleteFile(req.user?.photo);
    filteredBody.photo = files?.photo[0].key;
  }

  // 3) Update user document
  updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  })

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead',
  });
};

// exports.getUser = factory.getOne(User);
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ _id: req.user._id }).lean();

  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

exports.getSpecificUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  let user = await User.findById(id)
    .populate('portfolio.serviceType.serviceId')
    .lean();

  const serviceProviderReviews = await Review.find({
    other: id,
    reviewedOn: 'other',
  }).populate([{ path: 'tourist' }]);

  const bookedDates = await OtherBooking.aggregate([
    {
      $match: {
        other: ObjectId(id),
        status: { $in: ['pending', 'active'] },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'service',
        foreignField: '_id',
        as: 'service',
      },
    },
    {
      $unwind: {
        path: '$service',
      },
    },
    {
      $group: {
        _id: '$other',
        bookedDates: {
          $push: {
            booking: '$_id',
            service: '$service',
            noOfPersons: '$noOfPersons',
            price: '$price',
            user: '$user',
            startDate: '$startDate',
            endDate: '$endDate',
            dateRange: '$dateRange',
          },
        },
      },
    },
    {
      $project: {
        bookedDates: 1,
        _id: 0,
      },
    },
  ]);

  const reports = await Report.find({ other: id }, { user: 1 });

  user.reviews = serviceProviderReviews || [];
  user.bookedDates = bookedDates[0]?.bookedDates || [];
  user.reports = reports || [];

  res.status(200).json({
    status: 'success',
    data: user,
  });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 400;
  const skip = (page - 1) * limit;

  const { role, search, noPagination,department} = req.query;

  let query = { 
    role,
    ...(department=='all'?{department:{$ne:null}}:{department}) 
  };

  if (role == 'all')
    query = {
      ...query,
      role: {
        $in: ['applied-candidate', 'prospected-employee', 'ex-employee'],
      },
    };

  if (search && search != '')
    query = {
      ...query,
      $or: [
        { userName: { $regex: search, $options: 'i' } },
        { contactNo: { $regex: search, $options: 'i' } },
      ],
    };

    console.log(query)

  const users =
    noPagination && noPagination == 'true'
      ? await User.find(query)
      : await User.find(query)
          .sort('-updatedAt -createdAt')
          .skip(skip)
          .limit(limit);

  const totalCount = await User.countDocuments(query);

  res.status(200).json({
    status: 'success',
    results: users?.length || 0,
    totalCount,
    data: users,
  });
});

exports.activeDeactiveUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const status = req.body.status;

  const user = await User.findByIdAndUpdate(
    id,
    { isBlockedByAdmin: status },
    { new: true }
  );

  res.status(200).json({
    status: 'success',
    data: user,
  });
});

exports.addAppliedCandidate = catchAsync(async (req, res, next) => {
  const files=req.files;
  console.log("sdsd",req.body)
  console.log("files",files)

  if(files?.cv){
    req.body.cv=files?.cv[0].key;
  }

  const user = await User.create(req.body);

  res.status(200).json({
    status: 'success',
    data: user,
  });
});

exports.updateCandidate = catchAsync(async (req, res, next) => {
  const {id}=req.params;
  const files=req.files;
  const {user}=req;

  const foundUser=await User.findById(id);

  if(files?.cv){
    req.body.cv=files?.cv[0].key;
    if(foundUser?.cv)
    {
      await Document.findOneAndUpdate({cv:foundUser?.cv},{name:req.body.name,cv:files?.cv[0].key,userId:user?._id,documentType:req.body.documentType,department:req.body.department},{new:true})
    }
  }
  if(files?.offerLetter){
    req.body.offerLetter=files?.offerLetter[0].key;
    if(foundUser?.offerLetter)
    {
      await Document.findOneAndUpdate({offerLetter:foundUser?.offerLetter},{name:req.body.name,offerLetter:files?.offerLetter[0].key,userId:user?._id,documentType:req.body.documentType,department:req.body.department},{new:true})
    }
  }
  if(files?.experienceLetter){
    req.body.experienceLetter=files?.experienceLetter[0].key;
    if(foundUser?.experienceLetter)
    {
    await Document.findOneAndUpdate({experienceLetter:foundUser?.experienceLetter},{name:req.body.name,experienceLetter:files?.experienceLetter[0].key,userId:user?._id,documentType:req.body.documentType,department:req.body.department},{new:true})
    }
  }
  if(files?.degree){
    req.body.degree=files?.degree[0].key;
    if(foundUser?.degree)
    {
    await Document.findOneAndUpdate({degree:foundUser?.degree},{name:req.body.name,degree:files?.degree[0].key,userId:user?._id,documentType:req.body.documentType,department:req.body.department},{new:true})
    }
  }
  if(files?.otherCertificate){
    req.body.otherCertificate=files?.otherCertificate[0].key;
    if(foundUser?.otherCertificate)
    {
    await Document.findOneAndUpdate({otherCertificate:foundUser?.otherCertificate},{name:req.body.name,otherCertificate:files?.otherCertificate[0].key,userId:user?._id,documentType:req.body.documentType,department:req.body.department},{new:true})
    }
  }
  if(files?.certificate){
    req.body.certificate=files?.certificate[0].key;
    if(foundUser?.certificate)
    {
    await Document.findOneAndUpdate({certificate:foundUser?.certificate},{name:req.body.name,certificate:files?.certificate[0].key,userId:user?._id,documentType:req.body.documentType,department:req.body.department},{new:true})
    }
  }

  if(files?.terminationOrResignationLetter){
    req.body.terminationOrResignationLetter=files?.terminationOrResignationLetter[0].key;
    if(foundUser?.terminationOrResignationLetter)
    {
    await Document.findOneAndUpdate({terminationOrResignationLetter:foundUser?.terminationOrResignationLetter},{name:req.body.name,terminationOrResignationLetter:files?.terminationOrResignationLetter[0].key,userId:user?._id,documentType:req.body.documentType,department:req.body.department},{new:true})
    }
  }

  const updatedUser = await User.findByIdAndUpdate(id,req.body,{new:true});

  res.status(200).json({
    status: 'success',
    data:updatedUser,
  });
});
