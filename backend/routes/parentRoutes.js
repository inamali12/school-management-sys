const express = require('express');
const router = express.Router();
const {
  getParents,
  getParentById,
  createParent,
  updateParent,
  deleteParent,
  linkStudent,
  unlinkStudent,
  getMyChildren
} = require('../controllers/parentController');
const { protect, authorize } = require('../middleware/auth');

// All parent routes require authentication
router.use(protect);

// Parent personal children route (role: parent)
router.get('/my-children', authorize('parent'), getMyChildren);

// Admin Parent Management routes (role: admin only)
router.route('/')
  .get(authorize('admin'), getParents)
  .post(authorize('admin'), createParent);

router.route('/:id')
  .get(authorize('admin'), getParentById)
  .put(authorize('admin'), updateParent)
  .delete(authorize('admin'), deleteParent);

router.post('/:id/link-student', authorize('admin'), linkStudent);
router.delete('/:id/unlink-student/:studentId', authorize('admin'), unlinkStudent);

module.exports = router;

