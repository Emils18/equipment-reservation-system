// =====================================================
// Item Routes
// Equipment management URLs
// =====================================================

const express = require("express");

const {
  getAllItems,
  getActiveItems,
  addItem,
  updateItem,
  archiveItem,
  restoreItem,
  deleteItem,
} = require(
  "../controllers/itemController"
);

const {
  requireStaff,
} = require(
  "../middleware/authMiddleware"
);

const router = express.Router();


// =====================================================
// PUBLIC
// Borrower equipment list
// =====================================================

router.get(
  "/active",
  getActiveItems
);


// =====================================================
// STAFF ONLY
// =====================================================

router.use(requireStaff);


// View all equipment
router.get(
  "/",
  getAllItems
);


// Create
router.post(
  "/",
  addItem
);


// Edit
router.put(
  "/:id",
  updateItem
);


// Archive
router.patch(
  "/:id/archive",
  archiveItem
);


// Restore
router.patch(
  "/:id/restore",
  restoreItem
);


// Permanent Delete
router.delete(
  "/:id",
  deleteItem
);


module.exports = router;