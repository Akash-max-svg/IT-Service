/**
 * Role normalization and permission helpers
 * Canonical internal roles: 'Employee' | 'Agent' | 'Admin'
 * External/DB aliases handled:
 *  - Employee: 'employee', 'Employee'
 *  - Support Agent: 'support_agent', 'agent', 'Agent', 'Support Agent'
 *  - Administrator: 'administrator', 'admin', 'Admin', 'Administrator'
 */

export const normalizeRole = (role) => {
  if (!role) return 'Employee';
  const clean = String(role).toLowerCase().trim().replace(/[\s-]+/g, '_');
  if (clean === 'admin' || clean === 'administrator') return 'Admin';
  if (clean === 'agent' || clean === 'support_agent' || clean === 'supportagent') return 'Agent';
  return 'Employee';
};

export const getRoleDisplayName = (role) => {
  const norm = normalizeRole(role);
  if (norm === 'Admin') return 'Administrator';
  if (norm === 'Agent') return 'Support Agent';
  return 'Employee';
};

export const getRoleBadgeStyle = (role) => {
  const norm = normalizeRole(role);
  if (norm === 'Admin') {
    return 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300';
  }
  if (norm === 'Agent') {
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  }
  return 'border-sky-500/30 bg-sky-500/10 text-sky-300';
};

export const hasRole = (userRole, allowedRoles = []) => {
  if (!userRole) return false;
  const userNorm = normalizeRole(userRole);
  const normalizedAllowed = allowedRoles.map(normalizeRole);
  return normalizedAllowed.includes(userNorm);
};
