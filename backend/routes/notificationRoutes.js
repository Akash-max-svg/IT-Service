const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  markAsRead,
  getUnreadCount,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getMyNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);

module.exports = router;
