const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName:{
      type:String
    },
    lastName:{
      type:String
    },
    appliedDate: {
      type: Date,
    },
    contactNo: {
      type: String
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    dateOfBirth: {
      type: Date,
    },
    lastQualification: {
      type: String,
    },
    comments: {
      type: String,
    },
    currentSalary:{
      type:Number,
      default:0
    },
    currentPosition:{
      type:String,
      default:''
    },
    expectedSalary:{
      type:Number,
      default:0
    },
    interviewConductedBy:{
      type:String,
      default:''
    },
    status:{
      type:String,
      default:''
    },
    joiningPosition:{
      type:String,
      default:''
    },
    dateOfJoining:{
      type:Date,
    },
    reportingManager:{
      type:mongoose.Schema.Types.ObjectId,ref:'User',
    },
    additionalQualification:{
      type:String,
      default:''
    },
    totalExperience:{
      type:String,
      default:''
    },
    joiningSalary:{
      type:Number,
      default:0
    },
    workingShift:{
      type:String,
      default:''
    },
    documents:{
      type:[{type:mongoose.Schema.Types.ObjectId,ref:'Document'}],
      default:[]
    },
    photo: {
      type: String,
      default: 'default.png',
    },
    designation: {
      type: String,
    },
    cv: {
      type: String,
    },
    offerLetter: {
      type: String,
    },
    experienceLetter: {
      type: String,
    },
    degree: {
      type: String,
    },
    otherCertficate: {
      type: String,
    },
    terminationOrResignationLetter: {
      type: String,
    },
    role: {
      type: String,
      enum: [
        'admin',
        'hr',
        'manager',
        'applied-candidate',
        'prospected-employee',
        'employee',
        'ex-employee',
      ],
      default: 'applied-candidate',
    },
    email: {
      type: String,
      unique: true,
      // required: [true, 'Please provide your email'],
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
      index: true,
    },
    userName:{
      type:String,
      default:''
    },
    password: {
      type: String,
      // required: [true, 'Please provide a password'],
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      // type: String,
      // required: [true, 'Please confirm your password'],
      // validate: {
      //   // This only works on CREATE and SAVE!!!
      //   validator: function (el) {
      //     return el === this.password;
      //   },
      //   message: 'Passwords are not the same!',
      // },
    },
    reasonForLeaving:{
      type:String,
      default:''
    },
    dateOfLeaving:{
      type:Date
    },
    fcmToken: {
      type: [String],
      default: [],
    },  
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    socketId: {
      type: String
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    ratingsAverage: {
      type: Number,
      default: 0,
      min: [0, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10, // 4.666666, 46.6666, 47, 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    lastLogin: {
      type: Date,
      default: Date.now(),
    },
    lastLogout: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual populate
// userSchema.virtual('reviews', {
//   ref: 'Review',
//   foreignField: 'User',
//   localField: '_id',
// });

userSchema.set('toObject', { virtuals: true });
userSchema.set('toJSON', { virtuals: true });

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// userSchema.pre(/^find/, function (next) {
//   // this points to the current query
//   this.populate('featuredPackage');
//   next();
// });

userSchema.virtual('displayName').get(function () {
  return `${this.firstName || ''} ${this.lastName || ''}`;
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
