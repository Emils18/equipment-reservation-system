// =====================================================
// Staff Panel Routes
// =====================================================

const express = require("express");

const {
  requireStaff,
} = require(
  "../middleware/authMiddleware"
);

const {
  getDashboard,
  getRequests,
  getBorrowed,
  getRecords,
  updateReservationStatus,
} = require(
  "../controllers/staffController"
);

const router = express.Router();

// Everything below requires staff login
router.use(requireStaff);

router.get(
  "/dashboard",
  getDashboard
);

router.get(
  "/requests",
  getRequests
);

router.get(
  "/borrowed",
  getBorrowed
);

router.get(
  "/records",
  getRecords
);

router.patch(
  "/reservations/:id/status",
  updateReservationStatus
);

module.exports = router;