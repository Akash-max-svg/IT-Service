const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getAgents,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect);

router.get('/agents', authorize('Agent', 'Admin'), getAgents);
router.get('/', authorize('Admin'), getAllUsers);
router.route('/:id').put(authorize('Admin'), updateUser).delete(authorize('Admin'), deleteUser);

module.exports = router;
