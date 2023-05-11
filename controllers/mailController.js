const Mail = require('./../models/mailModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { deleteFile } = require('../utils/s3');
const Email = require('../utils/email');

exports.getAllMails = catchAsync(async (req, res, next) => {
  // for pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 400;
  const skip = (page - 1) * limit;
  const {user}=req;
  const {noPagination } = req.query;
  let query = {isActive: true ,$or:[{from:user?._id},{to:user?._id}]};

  const doc =
    noPagination == true
      ? await Mail.find(query)
          .sort('-updatedAt -createdAt')
      : await Mail.find(query)
          .sort('-updatedAt -createdAt')
          .skip(skip)
          .limit(limit);

  res.status(200).json({
    status: 'success',
    results: doc.length,
    data: doc,
  });
});

exports.getAllMailsForAdmin = catchAsync(async (req, res, next) => {
  // for pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 400;
  const skip = (page - 1) * limit;
  const {noPagination, status } = req.query;
  let query = { isActive: status };


  const doc =
    noPagination == true
      ? await Mail.find(query)
          .sort('-updatedAt -createdAt')
      : await Mail.find(query)
          .sort('-updatedAt -createdAt')
          .skip(skip)
          .limit(limit);

  const totalCount = await Mail.countDocuments(query);

  res.status(200).json({
    status: 'success',
    results: doc.length,
    totalCount,
    data: doc,
  });
});

exports.createMail = catchAsync(async (req, res, next) => {
  const {to,subject,text}=req.body;
  const {user}=req;
  const files = req.files;

  if (files?.attachments) req.body.attachments = files?.attachments.map((img)=>{img.key});

  const doc = await Mail.create(req.body);

  const payload={
    to,
    subject,
    from:user?.email,
    text
  }

  console.log("payload",payload)

  const userDetails={
    email:to
  }

  console.log("userDetails",userDetails)

  await new Email(userDetails,'')
      .sendEmail(payload)
      .catch((e) => console.log(e));

  res.status(201).json({
    status: 'success',
    data: doc,
  });
});

exports.deleteMail = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const count = await Mail.findById(id);

  // await deleteFile(count?.attachments);

  await Mail.findByIdAndDelete(id);

  res.status(200).json({
    status: 'success',
    message: 'Mail deleted successfully',
  });
});

exports.activateDeactivateMail = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const mail = await Mail.findByIdAndUpdate(
    id,
    { isActive: status },
    { new: true }
  );

  res.status(200).json({
    status: 'success',
    data: mail,
  });
});
