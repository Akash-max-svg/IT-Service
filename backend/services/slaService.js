const SLA = require('../models/SLA');

// Default SLA matrix: 2 Days (48 Hours = 2880 mins) resolution target for agent problem solving
const DEFAULT_SLA_TARGETS = {
  CRITICAL: { responseTimeMinutes: 30, resolutionTimeMinutes: 2880 },   // 30 mins resp, 2 days (48 hrs) res
  HIGH:     { responseTimeMinutes: 60, resolutionTimeMinutes: 2880 },   // 1 hr resp, 2 days (48 hrs) res
  MEDIUM:   { responseTimeMinutes: 120, resolutionTimeMinutes: 2880 }, // 2 hrs resp, 2 days (48 hrs) res
  LOW:      { responseTimeMinutes: 240, resolutionTimeMinutes: 2880 }, // 4 hrs resp, 2 days (48 hrs) res
};

/**
 * Calculates response and resolution deadlines given ticket priority
 */
const calculateDeadlines = async (priority) => {
  const normPriority = (priority || 'MEDIUM').toUpperCase();
  let slaConfig = await SLA.findOne({ priority: normPriority, isActive: true });

  let responseMinutes = DEFAULT_SLA_TARGETS[normPriority]?.responseTimeMinutes || 120;
  let resolutionMinutes = DEFAULT_SLA_TARGETS[normPriority]?.resolutionTimeMinutes || 2880; // 2 days (48 hrs)

  if (slaConfig) {
    responseMinutes = slaConfig.responseTimeMinutes;
    resolutionMinutes = slaConfig.resolutionTimeMinutes;
  }

  const now = new Date();
  const responseDueAt = new Date(now.getTime() + responseMinutes * 60000);
  const resolutionDueAt = new Date(now.getTime() + resolutionMinutes * 60000);

  return { responseDueAt, resolutionDueAt };
};

/**
 * Checks if a ticket has breached SLA response or resolution windows
 */
const evaluateBreachStatus = (ticket) => {
  const now = new Date();
  let isResponseBreached = ticket.isResponseBreached;
  let isResolutionBreached = ticket.isResolutionBreached;

  // Response check
  if (!ticket.respondedAt && ticket.responseDueAt && now > new Date(ticket.responseDueAt)) {
    isResponseBreached = true;
  }

  // Resolution check
  const terminalStatuses = ['RESOLVED', 'CLOSED'];
  if (!terminalStatuses.includes(ticket.status) && ticket.resolutionDueAt && now > new Date(ticket.resolutionDueAt)) {
    isResolutionBreached = true;
  }

  return { isResponseBreached, isResolutionBreached };
};

module.exports = {
  calculateDeadlines,
  evaluateBreachStatus,
  DEFAULT_SLA_TARGETS,
};
