// =====================================================
// Public Reservation Routes
//
// No borrower login is required.
// =====================================================

const express =
  require("express");


const {
  getCatalog,
  checkAvailability,
  createReservation,
  trackReservation,
} = require(
  "../controllers/reservationController"
);


const router =
  express.Router();


// =====================================================
// Borrower Equipment Catalog
// =====================================================

router.get(
  "/catalog",
  getCatalog
);


// =====================================================
// Check Equipment Availability
// =====================================================

router.post(
  "/check-availability",
  checkAvailability
);


// =====================================================
// Submit Reservation
// =====================================================

router.post(
  "/",
  createReservation
);


// =====================================================
// Track Using Reference Number
// =====================================================

router.get(
  "/track/:referenceCode",
  trackReservation
);


module.exports = router;