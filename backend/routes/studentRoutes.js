const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentById,
  generateStudentId,
  createStudent,
  updateStudent,
  deleteStudent,
  linkParent,
  unlinkParent
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth');

// All student routes require authentication
router.use(protect);

router.get('/generate/next-id', authorize('admin'), generateStudentId);

router.route('/')
  .get(getStudents) // Admin, Teacher, Parent (filtered by role)
  .post(authorize('admin'), createStudent);

router.route('/:id')
  .get(getStudentById)
  .put(authorize('admin'), updateStudent)
  .delete(authorize('admin'), deleteStudent);

router.post('/:id/link-parent', authorize('admin'), linkParent);
router.delete('/:id/unlink-parent', authorize('admin'), unlinkParent);

module.exports = router;

