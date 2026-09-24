const mongoose = require('mongoose');

const commentAttachmentSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  fileType: { type: String },
  fileSize: { type: Number },
});

const commentSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Comment message cannot be empty'],
      trim: true,
    },
    isInternalNote: {
      type: Boolean,
      default: false,
      // Internal notes are visible only to Agents and Admins
    },
    attachments: [commentAttachmentSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Comment', commentSchema);
