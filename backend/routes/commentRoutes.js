const express = require('express');
const router = express.Router();
const { addComment, getCommentsByTicket } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.post('/', upload.array('attachments', 3), addComment);
router.get('/:ticketId', getCommentsByTicket);

module.exports = router;
