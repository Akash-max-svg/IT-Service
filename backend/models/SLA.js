const mongoose = require('mongoose');

const slaSchema = new mongoose.Schema(
  {
    priority: {
      type: String,
      required: true,
      unique: true,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    },
    responseTimeMinutes: {
      type: Number,
      required: true,
      // Target time in minutes before first agent response/assignment
    },
    resolutionTimeMinutes: {
      type: Number,
      required: true,
      // Target time in minutes before resolution
    },
    description: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SLA', slaSchema);
