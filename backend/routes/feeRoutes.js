const express = require('express');
const router = express.Router();
const {
  getFees,
  getFeeById,
  generateFeeId,
  createFee,
  generateBulkFees,
  recordPayment,
  updateFee,
  deleteFee,
  getFeeStats
} = require('../controllers/feeController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/stats/summary', authorize('admin'), getFeeStats);
router.get('/generate/next-id', authorize('admin'), generateFeeId);
router.post('/bulk-generate', authorize('admin'), generateBulkFees);
router.post('/:id/pay', authorize('admin'), recordPayment);

router.route('/')
  .get(getFees) // Admin, Parent (Parents see only their child's fees; teachers blocked)
  .post(authorize('admin'), createFee);

router.route('/:id')
  .get(getFeeById)
  .put(authorize('admin'), updateFee)
  .delete(authorize('admin'), deleteFee);

module.exports = router;
