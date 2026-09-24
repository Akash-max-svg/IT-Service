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

router.use(protect);

router
  .route('/')
  .post(upload.array('attachments', 5), createTicket)
  .get(getTickets);

router.route('/:id').get(getTicketById);

router.put('/:id/status', updateTicketStatus);
router.put('/:id/assign', authorize('Agent', 'Admin'), assignTicket);
router.put('/:id/escalate', authorize('Agent', 'Admin'), escalateTicket);
router.post('/:id/feedback', authorize('Employee'), submitFeedback);

module.exports = router;
