const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Category = require('../models/Category');
const Department = require('../models/Department');
const SLA = require('../models/SLA');
const AuditLog = require('../models/AuditLog');
const Feedback = require('../models/Feedback');

// @desc    Get system-wide summary metrics for Admin Dashboard
// @route   GET /api/admin/metrics
// @access  Private (Admin)
const getAdminMetrics = async (req, res) => {
  try {
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      escalatedTickets,
      closedTickets,
      breachedTickets,
      totalUsers,
      totalAgents,
      categoriesCount,
      feedbacks,
    ] = await Promise.all([
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: { $in: ['OPEN', 'ASSIGNED'] } }),
      Ticket.countDocuments({ status: 'IN PROGRESS' }),
      Ticket.countDocuments({ status: 'RESOLVED' }),
      Ticket.countDocuments({ status: 'ESCALATED' }),
      Ticket.countDocuments({ status: 'CLOSED' }),
      Ticket.countDocuments({
        $or: [{ isResponseBreached: true }, { isResolutionBreached: true }],
      }),
      User.countDocuments(),
      User.countDocuments({ role: { $in: ['Agent', 'Admin'] } }),
      Category.countDocuments({ isActive: true }),
      Feedback.find().select('rating'),
    ]);

    // Average CSAT
    let avgCSAT = 0;
    if (feedbacks.length > 0) {
      const sum = feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0);
      avgCSAT = Number((sum / feedbacks.length).toFixed(1));
    }

    // SLA Compliance %
    const resolvedOrClosed = resolvedTickets + closedTickets;
    const slaCompliance =
      totalTickets > 0
        ? Math.max(0, Math.round(((totalTickets - breachedTickets) / totalTickets) * 100))
        : 100;

    // Distribution by Priority
    const priorityDistribution = await Ticket.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    // Distribution by Status
    const statusDistribution = await Ticket.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Distribution by Category
    const categoryDistribution = await Ticket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]);

    // Recent 5 audit logs
    const recentActivity = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('performedBy', 'name role avatar')
      .populate('ticket', 'ticketNumber title');

    res.json({
      counts: {
        totalTickets,
        openTickets,
        inProgressTickets,
        resolvedTickets,
        escalatedTickets,
        closedTickets,
        breachedTickets,
        totalUsers,
        totalAgents,
        categoriesCount,
        avgCSAT,
        slaCompliance,
      },
      priorityDistribution,
      statusDistribution,
      categoryDistribution,
      recentActivity,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get detailed reports & analytics
// @route   GET /api/admin/reports
// @access  Private (Admin)
const getReports = async (req, res) => {
  try {
    // Agent performance (tickets assigned, resolved, avg rating)
    const agents = await User.find({ role: { $in: ['Agent', 'Admin'] } }).select('name email specialization');

    const agentPerformance = await Promise.all(
      agents.map(async (agent) => {
        const [assignedCount, resolvedCount] = await Promise.all([
          Ticket.countDocuments({ assignedTo: agent._id }),
          Ticket.countDocuments({ assignedTo: agent._id, status: { $in: ['RESOLVED', 'CLOSED'] } }),
        ]);

        const agentFeedbacks = await Feedback.find({ agent: agent._id });
        const avgRating =
          agentFeedbacks.length > 0
            ? Number((agentFeedbacks.reduce((a, b) => a + b.rating, 0) / agentFeedbacks.length).toFixed(1))
            : null;

        return {
          agentId: agent._id,
          name: agent.name,
          email: agent.email,
          specialization: agent.specialization,
          assignedCount,
          resolvedCount,
          avgRating: avgRating || 'N/A',
        };
      })
    );

    // Monthly volume trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyTrend = await Ticket.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
          resolved: {
            $sum: {
              $cond: [{ $in: ['$status', ['RESOLVED', 'CLOSED']] }, 1, 0],
            },
          },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      agentPerformance,
      monthlyTrend,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get system audit logs
// @route   GET /api/admin/audit-logs
// @access  Private (Admin)
const getAuditLogs = async (req, res) => {
  try {
    const { action, limit = 50, page = 1 } = req.query;
    const query = {};
    if (action && action !== 'ALL') {
      query.action = action;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .populate('performedBy', 'name email role')
        .populate('ticket', 'ticketNumber title'),
      AuditLog.countDocuments(query),
    ]);

    res.json({ logs, total, pages: Math.ceil(total / parseInt(limit, 10)) || 1 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Category Management ---
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, subcategories, description, defaultPriority } = req.body;
    const category = await Category.create({
      name,
      subcategories: subcategories || [],
      description: description || '',
      defaultPriority: defaultPriority || 'MEDIUM',
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Department Management ---
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createDepartment = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    const department = await Department.create({ name, code, description });
    res.status(201).json(department);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- SLA Rules Management ---
const getSLARules = async (req, res) => {
  try {
    const rules = await SLA.find().sort({ priority: 1 });
    res.json(rules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSLARule = async (req, res) => {
  try {
    const { priority, responseTimeMinutes, resolutionTimeMinutes, description } = req.body;
    const rule = await SLA.findOneAndUpdate(
      { priority },
      { responseTimeMinutes, resolutionTimeMinutes, description },
      { new: true, upsert: true }
    );
    res.json(rule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAdminMetrics,
  getReports,
  getAuditLogs,
  getCategories,
  createCategory,
  updateCategory,
  getDepartments,
  createDepartment,
  getSLARules,
  updateSLARule,
};
