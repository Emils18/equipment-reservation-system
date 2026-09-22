// =====================================================
// Staff Panel Routes
// =====================================================

const express =
  require("express");


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
  confirmIdDeposit,
  completeReturn,
} = require(
  "../controllers/staffController"
);


const router =
  express.Router();


// Everything below requires staff login
router.use(
  requireStaff
);


// =====================================================
// Dashboard
// =====================================================

router.get(
  "/dashboard",
  getDashboard
);


// =====================================================
// Reservation Requests
// =====================================================

router.get(
  "/requests",
  getRequests
);


// =====================================================
// Borrowed Equipment
// =====================================================

router.get(
  "/borrowed",
  getBorrowed
);


// =====================================================
// Records
// =====================================================

router.get(
  "/records",
  getRecords
);


// =====================================================
// Reservation Workflow
// =====================================================

router.patch(
  "/reservations/:id/status",
  updateReservationStatus
);


// Confirm borrower left School ID
router.patch(
  "/reservations/:id/id-deposit",
  confirmIdDeposit
);


// Complete physical equipment + ID return
router.patch(
  "/reservations/:id/complete-return",
  completeReturn
);


module.exports = router;