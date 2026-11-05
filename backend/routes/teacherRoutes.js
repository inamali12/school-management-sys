const express = require('express');
const router = express.Router();
const {
  getTeachers,
  getTeacherById,
  generateTeacherId,
  createTeacher,
  updateTeacher,
  deleteTeacher
} = require('../controllers/teacherController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/generate/next-id', authorize('admin'), generateTeacherId);

router.route('/')
  .get(getTeachers)
  .post(authorize('admin'), createTeacher);

router.route('/:id')
  .get(getTeacherById)
  .put(authorize('admin'), updateTeacher)
  .delete(authorize('admin'), deleteTeacher);

module.exports = router;
