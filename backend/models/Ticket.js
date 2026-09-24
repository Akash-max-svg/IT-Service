const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  fileName: { type: String, required: false, default: '' },
  filePath: { type: String, required: false, default: '' },
  fileType: { type: String, default: '' },
  fileSize: { type: Number, default: 0 },
  uploadedAt: { type: Date, default: Date.now },
});

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Ticket title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Ticket description is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
    },
    subcategory: {
      type: String,
      default: '',
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true,
    },
    status: {
      type: String,
      enum: [
        'OPEN',
        'ASSIGNED',
        'IN PROGRESS',
        'WAITING FOR USER',
        'ESCALATED',
        'RESOLVED',
        'CLOSED',
        'REOPENED',
      ],
      default: 'OPEN',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    departmentName: {
      type: String,
      default: 'IT Support',
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
      required: false,
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    reopenedAt: {
      type: Date,
      default: null,
    },
    reopenedCount: {
      type: Number,
      default: 0,
    },
    responseDueAt: {
      type: Date,
      default: null,
    },
    resolutionDueAt: {
      type: Date,
      default: null,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
    isResponseBreached: {
      type: Boolean,
      default: false,
    },
    isResolutionBreached: {
      type: Boolean,
      default: false,
    },
    escalationReason: {
      type: String,
      default: '',
    },
    feedback: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Feedback',
      default: null,
    },
    tags: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ticket', ticketSchema);
