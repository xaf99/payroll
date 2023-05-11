const mongoose = require('mongoose');
const mailSchema = new mongoose.Schema(
  {
    from: {
      type:String
    },
    to: {
      type:String
    },
    subject: {
      type: String,
    },
    text: {
      type:String,
      default: '',
    },
    attachments:{
      type:[String],
      default:[]
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Mail = mongoose.model('Mail', mailSchema);

module.exports = Mail;
