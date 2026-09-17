// =====================================================
// Staff Authentication Routes
// =====================================================

const express = require("express");

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

const router = express.Router();

// Public routes
router.get(
  "/setup-status",
  setupStatus
);

router.post(
  "/register",
  register
);

router.post(
  "/login",
  login
);

// Protected routes
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