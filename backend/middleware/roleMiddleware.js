const { hasRole } = require('../utils/roleUtils');

// Role authorization middleware
// Usage: authorize('Admin') or authorize('Admin', 'Agent')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!hasRole(req.user.role, roles)) {
      return res.status(403).json({
        message: `Role '${req.user.role}' is not authorized to access this resource`,
      });
    }

    next();
  };
};

module.exports = { authorize };
