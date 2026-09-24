const express = require('express');
const router = express.Router();
const {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
  assignTicket,
  escalateTicket,
  submitFeedback,
} = require('../controllers/ticketController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Protect all ticket routes with JWT authentication
router.use(protect);

// Safe multer wrapper to intercept upload errors gracefully
const handleUpload = (req, res, next) => {
  upload.array('attachments', 5)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'File attachment upload failed' });
    }
    next();
  });
};

router
  .route('/')
  .post(handleUpload, createTicket)
  .get(getTickets);

router.route('/:id').get(getTicketById);

router.put('/:id/status', updateTicketStatus);
router.put('/:id/assign', authorize('Agent', 'Admin'), assignTicket);
router.put('/:id/escalate', authorize('Agent', 'Admin'), escalateTicket);
router.post('/:id/feedback', authorize('Employee'), submitFeedback);

module.exports = router;
