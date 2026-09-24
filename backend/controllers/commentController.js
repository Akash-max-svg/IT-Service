const Comment = require('../models/Comment');
const Ticket = require('../models/Ticket');
const AuditLog = require('../models/AuditLog');
const { sendNotification, broadcastTicketUpdate } = require('../services/notificationService');
const { normalizeRole, hasRole } = require('../utils/roleUtils');

// @desc    Add comment to a ticket
// @route   POST /api/comments
// @access  Private
const addComment = async (req, res) => {
  try {
    const { ticketId, message, isInternalNote } = req.body;

    if (!ticketId || !message) {
      return res.status(400).json({ message: 'Ticket ID and message are required' });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const userRole = normalizeRole(req.user.role);

    // Role check: Employee cannot post internal notes
    const internalNoteFlag = userRole !== 'Employee' && isInternalNote === true;

    // Check Employee access
    if (userRole === 'Employee' && ticket.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map((f) => ({
        fileName: f.originalname,
        filePath: `/uploads/${f.filename}`,
        fileType: f.mimetype,
        fileSize: f.size,
      }));
    }

    const comment = await Comment.create({
      ticket: ticketId,
      user: req.user._id,
      message,
      isInternalNote: internalNoteFlag,
      attachments,
    });

    // Mark first response time if agent commented and not yet responded
    if (hasRole(req.user.role, ['Agent', 'Admin']) && !ticket.respondedAt) {
      ticket.respondedAt = new Date();
      if (ticket.status === 'OPEN') {
        ticket.status = 'IN PROGRESS';
      }
      await ticket.save();

      broadcastTicketUpdate(ticket._id, 'ticket_updated', {
        ticketId: ticket._id,
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
      });
    }

    // Audit log
    await AuditLog.create({
      ticket: ticket._id,
      performedBy: req.user._id,
      action: internalNoteFlag ? 'INTERNAL_NOTE_ADDED' : 'COMMENT_ADDED',
      notes: message.length > 80 ? message.substring(0, 80) + '...' : message,
    });

    // Notify counterpart
    if (!internalNoteFlag) {
      if (userRole === 'Employee' && ticket.assignedTo) {
        // Notify assigned agent
        await sendNotification({
          recipientId: ticket.assignedTo,
          senderId: req.user._id,
          ticketId: ticket._id,
          title: `New Comment on ${ticket.ticketNumber}`,
          message: `${req.user.name}: "${message.substring(0, 75)}"`,
          type: 'COMMENT_ADDED',
        });
      } else if (hasRole(req.user.role, ['Agent', 'Admin'])) {
        // Notify employee
        await sendNotification({
          recipientId: ticket.createdBy,
          senderId: req.user._id,
          ticketId: ticket._id,
          title: `Support Agent Responded to ${ticket.ticketNumber}`,
          message: `${req.user.name}: "${message.substring(0, 75)}"`,
          type: 'COMMENT_ADDED',
        });
      }
    }

    const populated = await Comment.findById(comment._id).populate('user', 'name role avatar');

    // Real-time broadcast to ticket discussion room
    broadcastTicketUpdate(ticket._id, 'new_comment', populated);

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get comments for a ticket
// @route   GET /api/comments/:ticketId
// @access  Private
const getCommentsByTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Role check: Employee can only view their own ticket comments
    if (req.user.role === 'Employee' && ticket.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const query = { ticket: ticketId };

    // Employees cannot see internal agent notes
    if (req.user.role === 'Employee') {
      query.isInternalNote = false;
    }

    const comments = await Comment.find(query)
      .sort({ createdAt: 1 })
      .populate('user', 'name role avatar');

    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addComment,
  getCommentsByTicket,
};
