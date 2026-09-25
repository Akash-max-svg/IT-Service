/**
 * Backend role normalization and permission helpers
 * Canonical internal roles: 'Employee' | 'Agent' | 'Admin'
 */

const normalizeRole = (role) => {
  if (!role) return 'Employee';
  const clean = String(role).toLowerCase().trim().replace(/[\s-]+/g, '_');
  if (clean === 'admin' || clean === 'administrator') return 'Admin';
  if (clean === 'agent' || clean === 'support_agent' || clean === 'supportagent') return 'Agent';
  return 'Employee';
};

const getRoleDisplayName = (role) => {
  const norm = normalizeRole(role);
  if (norm === 'Admin') return 'Administrator';
  if (norm === 'Agent') return 'Support Agent';
  return 'Employee';
};

const hasRole = (userRole, allowedRoles = []) => {
  if (!userRole) return false;
  const userNorm = normalizeRole(userRole);
  const normalizedAllowed = allowedRoles.map(normalizeRole);
  return normalizedAllowed.includes(userNorm);
};

module.exports = {
  normalizeRole,
  getRoleDisplayName,
  hasRole,
};
