const Notification = require('../models/Notification');

let ioInstance = null;

const setSocketIO = (io) => {
  ioInstance = io;
};

/**
 * Creates and dispatches notification via DB and Socket.IO
 */
const sendNotification = async ({
  recipientId,
  senderId = null,
  ticketId = null,
  title,
  message,
  type = 'STATUS_CHANGED',
}) => {
  try {
    if (!recipientId) return null;

    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      ticket: ticketId,
      title,
      message,
      type,
    });

    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender', 'name role avatar')
      .populate('ticket', 'ticketNumber title status priority');

    // Emit real-time notification to user's personal room
    if (ioInstance) {
      ioInstance.to(`user_${recipientId.toString()}`).emit('notification', populatedNotification);
    }

    return populatedNotification;
  } catch (error) {
    console.error('Notification dispatch error:', error.message);
    return null;
  }
};

/**
 * Broadcast event to all agents and admins
 */
const broadcastToSupport = (event, payload) => {
  if (ioInstance) {
    ioInstance.to('support_team').emit(event, payload);
  }
};

module.exports = {
  setSocketIO,
  sendNotification,
  broadcastToSupport,
};
