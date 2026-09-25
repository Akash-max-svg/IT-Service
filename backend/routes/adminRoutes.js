const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

// Categories and departments can be read by any authenticated user for dropdowns
router.get('/categories', getCategories);
router.get('/departments', getDepartments);
router.get('/sla-rules', getSLARules);

// Administrative restricted actions
router.get('/metrics', authorize('Admin'), getAdminMetrics);
router.get('/reports', authorize('Admin'), getReports);
router.get('/audit-logs', authorize('Admin'), getAuditLogs);

router.post('/categories', authorize('Admin'), createCategory);
router.put('/categories/:id', authorize('Admin'), updateCategory);

router.post('/departments', authorize('Admin'), createDepartment);
router.put('/sla-rules', authorize('Admin'), updateSLARule);

module.exports = router;
