const express = require('express');
const router = express.Router();
const {
  getAttendance,
  getAttendanceStats,
  markAttendance,
  markBulkAttendance,
  updateAttendance,
  deleteAttendance
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/stats', getAttendanceStats);
router.post('/bulk', authorize('admin', 'teacher'), markBulkAttendance);

router.route('/')
  .get(getAttendance)
  .post(authorize('admin', 'teacher'), markAttendance);

router.route('/:id')
  .put(authorize('admin', 'teacher'), updateAttendance)
  .delete(authorize('admin'), deleteAttendance);

module.exports = router;
