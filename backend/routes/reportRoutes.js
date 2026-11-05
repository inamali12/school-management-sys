const express = require('express');
const router = express.Router();
const {
  getStudentReport,
  getDailyAttendanceReport,
  getMonthlyAttendanceReport,
  getFeeCollectionReport,
  getFeeDefaultersReport,
  getTeacherReport
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/students', authorize('admin'), getStudentReport);
router.get('/attendance-daily', authorize('admin', 'teacher'), getDailyAttendanceReport);
router.get('/attendance-monthly', authorize('admin', 'teacher'), getMonthlyAttendanceReport);
router.get('/fees-collection', authorize('admin'), getFeeCollectionReport);
router.get('/fees-defaulters', authorize('admin'), getFeeDefaultersReport);
router.get('/teachers', authorize('admin'), getTeacherReport);

module.exports = router;
