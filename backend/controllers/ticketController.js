const Ticket = require('../models/Ticket');
const AuditLog = require('../models/AuditLog');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const generateTicketNumber = require('../utils/generateTicketNumber');
const { calculateDeadlines, evaluateBreachStatus } = require('../services/slaService');
const { sendNotification, broadcastToSupport } = require('../services/notificationService');
const { sendTicketEmail } = require('../services/emailService');

// @desc    Create a new incident ticket
// @route   POST /api/tickets
// @access  Private (Employee, Agent, Admin)
const createTicket = async (req, res) => {
  try {
    const { title, description, category, subcategory, priority, departmentName, tags } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Title, description, and category are required' });
    }

    const ticketPriority = (priority || 'MEDIUM').toUpperCase();
    const ticketNumber = await generateTicketNumber();
    const { responseDueAt, resolutionDueAt } = await calculateDeadlines(ticketPriority);

    // Process file attachments from multer if provided
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map((file) => ({
        fileName: file.originalname,
        filePath: `/uploads/${file.filename}`,
        fileType: file.mimetype,
        fileSize: file.size,
      }));
    }

    const ticket = await Ticket.create({
      ticketNumber,
      title,
      description,
      category,
      subcategory: subcategory || '',
      priority: ticketPriority,
      departmentName: departmentName || req.user.departmentName || 'IT Support',
      createdBy: req.user._id,
      attachments,
      responseDueAt,
      resolutionDueAt,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim())) : [],
    });

    // Record Audit Log
    await AuditLog.create({
      ticket: ticket._id,
      performedBy: req.user._id,
      action: 'TICKET_CREATED',
      newValue: {
        ticketNumber,
        title,
        priority: ticketPriority,
        category,
      },
      notes: `Ticket submitted with ${ticketPriority} priority`,
    });

    // Broadcast to support team
    broadcastToSupport('new_ticket', {
      _id: ticket._id,
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      priority: ticket.priority,
      createdAt: ticket.createdAt,
    });

    // Send confirmation email
    await sendTicketEmail({
      to: req.user.email,
      subject: `[${ticket.ticketNumber}] Ticket Received: ${ticket.title}`,
      html: `
        <h2>Your IT Support Ticket Has Been Created</h2>
        <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
        <p><strong>Title:</strong> ${ticket.title}</p>
        <p><strong>Category:</strong> ${ticket.category} (${ticket.subcategory || 'General'})</p>
        <p><strong>Priority:</strong> ${ticket.priority}</p>
        <p>Our support team has been notified and will review your ticket within the SLA response window.</p>
      `,
    });

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('createdBy', 'name email departmentName avatar')
      .populate('assignedTo', 'name email specialization avatar');

    res.status(201).json(populatedTicket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get tickets with role filtering, search, and pagination
// @route   GET /api/tickets
// @access  Private
const getTickets = async (req, res) => {
  try {
    const { status, priority, category, search, assignedTo, page = 1, limit = 50, breached } = req.query;

    const query = {};

    // Role-based visibility
    if (req.user.role === 'Employee') {
      query.createdBy = req.user._id;
    } else if (req.user.role === 'Agent') {
      // Agents can view tickets assigned to them or open unassigned tickets
      if (req.query.assignedOnly === 'true') {
        query.assignedTo = req.user._id;
      }
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    if (priority && priority !== 'ALL') {
      query.priority = priority;
    }

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (assignedTo) {
      if (assignedTo === 'UNASSIGNED') {
        query.assignedTo = null;
      } else {
        query.assignedTo = assignedTo;
      }
    }

    if (search) {
      query.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    if (breached === 'true') {
      query.$or = [{ isResponseBreached: true }, { isResolutionBreached: true }];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate('createdBy', 'name email departmentName avatar')
        .populate('assignedTo', 'name email specialization avatar')
        .populate('feedback'),
      Ticket.countDocuments(query),
    ]);

    // Live evaluate breach status
    const evaluatedTickets = tickets.map((t) => {
      const { isResponseBreached, isResolutionBreached } = evaluateBreachStatus(t);
      t.isResponseBreached = isResponseBreached;
      t.isResolutionBreached = isResolutionBreached;
      return t;
    });

    res.json({
      tickets: evaluatedTickets,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)) || 1,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single ticket details & timeline
// @route   GET /api/tickets/:id
// @access  Private
const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('createdBy', 'name email departmentName phone avatar')
      .populate('assignedTo', 'name email specialization phone avatar')
      .populate('feedback');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Role check: Employee can only see their own ticket
    if (req.user.role === 'Employee' && ticket.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied to this ticket' });
    }

    // Evaluate live SLA breach status
    const { isResponseBreached, isResolutionBreached } = evaluateBreachStatus(ticket);
    let breachedChanged = false;
    if (ticket.isResponseBreached !== isResponseBreached || ticket.isResolutionBreached !== isResolutionBreached) {
      ticket.isResponseBreached = isResponseBreached;
      ticket.isResolutionBreached = isResolutionBreached;
      breachedChanged = true;
    }
    if (breachedChanged) {
      await ticket.save();
    }

    // Fetch audit timeline logs for this ticket
    const auditLogs = await AuditLog.find({ ticket: ticket._id })
      .sort({ createdAt: 1 })
      .populate('performedBy', 'name role avatar');

    res.json({
      ticket,
      auditLogs,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update ticket status (Lifecycle transitions)
// @route   PUT /api/tickets/:id/status
// @access  Private (Agent, Admin, or Employee if reopening/closing)
const updateTicketStatus = async (req, res) => {
  try {
    const { status, resolutionNotes, note } = req.body;
    const ticket = await Ticket.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const previousStatus = ticket.status;
    const allowedStatuses = [
      'OPEN',
      'ASSIGNED',
      'IN PROGRESS',
      'WAITING FOR USER',
      'ESCALATED',
      'RESOLVED',
      'CLOSED',
      'REOPENED',
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status: ${status}` });
    }

    // Role permissions for state transitions
    if (req.user.role === 'Employee') {
      // Employees can only REOPEN or CLOSE
      if (!['REOPENED', 'CLOSED'].includes(status)) {
        return res.status(403).json({ message: 'Employees can only reopen or close resolved tickets' });
      }
      if (ticket.createdBy._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'You can only update your own tickets' });
      }
    }

    // Update state fields
    ticket.status = status;

    if (status === 'IN PROGRESS' && !ticket.respondedAt) {
      ticket.respondedAt = new Date();
    }

    if (status === 'RESOLVED') {
      ticket.resolvedAt = new Date();
      if (resolutionNotes) {
        ticket.resolutionNotes = resolutionNotes;
      }
    }

    if (status === 'CLOSED') {
      ticket.closedAt = new Date();
    }

    if (status === 'REOPENED') {
      ticket.reopenedAt = new Date();
      ticket.reopenedCount += 1;
      ticket.status = 'REOPENED';
    }

    await ticket.save();

    // Record Audit Log
    await AuditLog.create({
      ticket: ticket._id,
      performedBy: req.user._id,
      action: 'STATUS_UPDATED',
      previousValue: previousStatus,
      newValue: status,
      notes: note || resolutionNotes || `Status changed from ${previousStatus} to ${status}`,
    });

    // Notify ticket owner if agent changed status
    if (req.user._id.toString() !== ticket.createdBy._id.toString()) {
      await sendNotification({
        recipientId: ticket.createdBy._id,
        senderId: req.user._id,
        ticketId: ticket._id,
        title: `Ticket Status Updated: ${status}`,
        message: `Your ticket ${ticket.ticketNumber} is now ${status}. ${resolutionNotes ? 'Resolution notes: ' + resolutionNotes : ''}`,
        type: status === 'RESOLVED' ? 'RESOLVED' : 'STATUS_CHANGED',
      });

      await sendTicketEmail({
        to: ticket.createdBy.email,
        subject: `[${ticket.ticketNumber}] Status Changed to ${status}`,
        html: `
          <h2>Ticket Status Update</h2>
          <p>Your ticket <strong>${ticket.ticketNumber}</strong> (${ticket.title}) has been updated.</p>
          <p><strong>Current Status:</strong> ${status}</p>
          ${resolutionNotes ? `<p><strong>Resolution Notes:</strong> ${resolutionNotes}</p>` : ''}
          <p>Please log in to your IT Service Desk portal to view details.</p>
        `,
      });
    }

    // Notify agent if employee reopened
    if (status === 'REOPENED' && ticket.assignedTo) {
      await sendNotification({
        recipientId: ticket.assignedTo._id,
        senderId: req.user._id,
        ticketId: ticket._id,
        title: `Ticket Reopened: ${ticket.ticketNumber}`,
        message: `${req.user.name} reported that the issue still exists.`,
        type: 'REOPENED',
      });
    }

    const updated = await Ticket.findById(ticket._id)
      .populate('createdBy', 'name email departmentName avatar')
      .populate('assignedTo', 'name email specialization avatar')
      .populate('feedback');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign ticket to an agent (or self-claim)
// @route   PUT /api/tickets/:id/assign
// @access  Private (Agent, Admin)
const assignTicket = async (req, res) => {
  try {
    const { agentId } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const targetAgentId = agentId || req.user._id;
    const agent = await User.findById(targetAgentId);

    if (!agent || !['Agent', 'Admin'].includes(agent.role)) {
      return res.status(400).json({ message: 'Selected user is not a valid support agent' });
    }

    const previousAssignee = ticket.assignedTo;
    ticket.assignedTo = targetAgentId;

    if (ticket.status === 'OPEN') {
      ticket.status = 'ASSIGNED';
    }

    if (!ticket.respondedAt) {
      ticket.respondedAt = new Date();
    }

    await ticket.save();

    // Audit Log
    await AuditLog.create({
      ticket: ticket._id,
      performedBy: req.user._id,
      action: 'ASSIGNED_AGENT',
      previousValue: previousAssignee,
      newValue: targetAgentId,
      notes: `Ticket assigned to ${agent.name} (${agent.role})`,
    });

    // Notify newly assigned agent
    if (targetAgentId.toString() !== req.user._id.toString()) {
      await sendNotification({
        recipientId: targetAgentId,
        senderId: req.user._id,
        ticketId: ticket._id,
        title: `New Ticket Assigned: ${ticket.ticketNumber}`,
        message: `You have been assigned to handle incident: ${ticket.title} (${ticket.priority})`,
        type: 'ASSIGNED',
      });
    }

    // Notify ticket creator
    await sendNotification({
      recipientId: ticket.createdBy,
      senderId: req.user._id,
      ticketId: ticket._id,
      title: `Agent Assigned: ${agent.name}`,
      message: `${agent.name} has been assigned to your ticket ${ticket.ticketNumber}.`,
      type: 'ASSIGNED',
    });

    const updated = await Ticket.findById(ticket._id)
      .populate('createdBy', 'name email departmentName avatar')
      .populate('assignedTo', 'name email specialization avatar')
      .populate('feedback');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Escalate ticket
// @route   PUT /api/tickets/:id/escalate
// @access  Private (Agent, Admin)
const escalateTicket = async (req, res) => {
  try {
    const { reason, bumpPriority } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const prevPriority = ticket.priority;
    ticket.status = 'ESCALATED';
    ticket.escalationReason = reason || 'Escalated for senior tier support';

    if (bumpPriority && ['LOW', 'MEDIUM'].includes(ticket.priority)) {
      ticket.priority = 'HIGH';
    }

    await ticket.save();

    await AuditLog.create({
      ticket: ticket._id,
      performedBy: req.user._id,
      action: 'ESCALATED',
      previousValue: { status: ticket.status, priority: prevPriority },
      newValue: { status: 'ESCALATED', priority: ticket.priority },
      notes: ticket.escalationReason,
    });

    broadcastToSupport('ticket_escalated', {
      ticketNumber: ticket.ticketNumber,
      title: ticket.title,
      priority: ticket.priority,
      reason: ticket.escalationReason,
    });

    const updated = await Ticket.findById(ticket._id)
      .populate('createdBy', 'name email departmentName avatar')
      .populate('assignedTo', 'name email specialization avatar')
      .populate('feedback');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit feedback after ticket resolution
// @route   POST /api/tickets/:id/feedback
// @access  Private (Employee)
const submitFeedback = async (req, res) => {
  try {
    const { rating, comments, resolutionQuality } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (ticket.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only ticket creator can submit feedback' });
    }

    if (!['RESOLVED', 'CLOSED'].includes(ticket.status)) {
      return res.status(400).json({ message: 'Feedback can only be submitted for resolved tickets' });
    }

    const existingFeedback = await Feedback.findOne({ ticket: ticket._id });
    if (existingFeedback) {
      return res.status(400).json({ message: 'Feedback has already been submitted for this ticket' });
    }

    const feedback = await Feedback.create({
      ticket: ticket._id,
      employee: req.user._id,
      agent: ticket.assignedTo,
      rating: Number(rating),
      comments: comments || '',
      resolutionQuality: resolutionQuality || 'Good',
    });

    ticket.feedback = feedback._id;
    ticket.status = 'CLOSED';
    ticket.closedAt = new Date();
    await ticket.save();

    await AuditLog.create({
      ticket: ticket._id,
      performedBy: req.user._id,
      action: 'CLOSED',
      notes: `Ticket closed with feedback rating: ${rating}/5 stars`,
    });

    res.status(201).json({ feedback, ticket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
  assignTicket,
  escalateTicket,
  submitFeedback,
};
