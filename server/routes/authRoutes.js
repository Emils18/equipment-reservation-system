// =====================================================
// Staff Authentication Routes
// REPAIR ROOM - CMOB Department
// =====================================================
//
// Public:
// - Login
// - Setup status
//
// Protected:
// - Current staff account
// - Logout
// - Update name
// - Change password
//
// IMPORTANT:
// Public staff registration is intentionally NOT exposed.
// Existing staff accounts are managed internally.
//
// =====================================================

const express =
  require("express");

const {
  setupStatus,
  register,
  login,
  me,
  logout,
  updateProfile,
  changePassword,
} = require(
  "../controllers/authController"
);

const {
  requireStaff,
} = require(
  "../middleware/authMiddleware"
);

const router =
  express.Router();


// =====================================================
// PUBLIC
// =====================================================

router.get(
  "/setup-status",
  setupStatus
);

router.post(
  "/login",
  login
);

router.post(
  "/register",
  register
);
// =====================================================
// STAFF ONLY
// =====================================================




router.get(
  "/me",
  requireStaff,
  me
);

router.post(
  "/logout",
  requireStaff,
  logout
);

router.put(
  "/profile",
  requireStaff,
  updateProfile
);

router.put(
  "/password",
  requireStaff,
  changePassword
);


module.exports = router;
