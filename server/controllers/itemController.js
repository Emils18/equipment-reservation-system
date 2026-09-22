// =====================================================
// Item Controller
// Create, view, edit, archive, restore, and delete items
//
// Every equipment change emits "equipment_updated"
// so borrower pages update without refreshing.
// =====================================================

const database = require(
  "../config/database"
);


// =====================================================
// REAL-TIME HELPER
// =====================================================

const emitEquipmentUpdated = (
  req,
  itemId,
  action
) => {
  const io =
    req.app.get("io");

  if (!io) {
    return;
  }

  io.emit(
    "equipment_updated",
    {
      id: Number(
        itemId
      ),

      action,
    }
  );
};


// =====================================================
// GET ALL ITEMS
// Staff Panel
// =====================================================

const getAllItems =
  async (
    req,
    res
  ) => {
    try {
      const [items] =
        await database.query(`
          SELECT *
          FROM items
          ORDER BY
            is_active DESC,
            created_at DESC
        `);

      res.json({
        success: true,
        items,
      });
    } catch (error) {
      console.error(
        "Get items error:",
        error.message
      );

      res.status(
        500
      ).json({
        success: false,

        message:
          "Could not load equipment.",
      });
    }
  };


// =====================================================
// GET ACTIVE ITEMS
// Borrower Side
// =====================================================

const getActiveItems =
  async (
    req,
    res
  ) => {
    try {
      const [items] =
        await database.query(`
          SELECT *
          FROM items
          WHERE is_active = TRUE
          ORDER BY name ASC
        `);

      res.json({
        success: true,
        items,
      });
    } catch (error) {
      console.error(
        "Get active items error:",
        error.message
      );

      res.status(
        500
      ).json({
        success: false,

        message:
          "Could not load available equipment.",
      });
    }
  };


// =====================================================
// ADD ITEM
// =====================================================

const addItem =
  async (
    req,
    res
  ) => {
    try {
      const {
        name,
        category,
        asset_code,
        description,
        condition_status,
      } = req.body;


      if (
        !name ||
        name.trim() ===
          ""
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Item name is required.",
          });
      }


      const [result] =
        await database.query(
          `
          INSERT INTO items
          (
            name,
            category,
            asset_code,
            description,
            condition_status
          )
          VALUES (?, ?, ?, ?, ?)
          `,
          [
            name.trim(),

            category?.trim() ||
              null,

            asset_code?.trim() ||
              null,

            description?.trim() ||
              null,

            condition_status ||
              "good",
          ]
        );


      emitEquipmentUpdated(
        req,
        result.insertId,
        "created"
      );


      res.status(
        201
      ).json({
        success: true,

        message:
          "Equipment created successfully.",

        item_id:
          result.insertId,
      });
    } catch (error) {
      console.error(
        "Add item error:",
        error.message
      );


      if (
        error.code ===
        "ER_DUP_ENTRY"
      ) {
        return res
          .status(409)
          .json({
            success:
              false,

            message:
              "That asset code is already being used.",
          });
      }


      res.status(
        500
      ).json({
        success: false,

        message:
          "Could not create equipment.",
      });
    }
  };


// =====================================================
// UPDATE ITEM
// =====================================================

const updateItem =
  async (
    req,
    res
  ) => {
    try {
      const itemId =
        req.params.id;


      const {
        name,
        category,
        asset_code,
        description,
        condition_status,
      } = req.body;


      if (
        !name ||
        name.trim() ===
          ""
      ) {
        return res
          .status(400)
          .json({
            success:
              false,

            message:
              "Item name is required.",
          });
      }


      const [result] =
        await database.query(
          `
          UPDATE items
          SET
            name = ?,
            category = ?,
            asset_code = ?,
            description = ?,
            condition_status = ?
          WHERE id = ?
          `,
          [
            name.trim(),

            category?.trim() ||
              null,

            asset_code?.trim() ||
              null,

            description?.trim() ||
              null,

            condition_status ||
              "good",

            itemId,
          ]
        );


      if (
        result.affectedRows ===
        0
      ) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Equipment not found.",
          });
      }


      emitEquipmentUpdated(
        req,
        itemId,
        "updated"
      );


      res.json({
        success: true,

        message:
          "Equipment updated successfully.",
      });
    } catch (error) {
      console.error(
        "Update item error:",
        error.message
      );


      if (
        error.code ===
        "ER_DUP_ENTRY"
      ) {
        return res
          .status(409)
          .json({
            success:
              false,

            message:
              "That asset code is already being used.",
          });
      }


      res.status(
        500
      ).json({
        success: false,

        message:
          "Could not update equipment.",
      });
    }
  };


// =====================================================
// ARCHIVE ITEM
// =====================================================

const archiveItem =
  async (
    req,
    res
  ) => {
    try {
      const itemId =
        req.params.id;


      const [result] =
        await database.query(
          `
          UPDATE items
          SET is_active = FALSE
          WHERE id = ?
          `,
          [
            itemId,
          ]
        );


      if (
        result.affectedRows ===
        0
      ) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Equipment not found.",
          });
      }


      emitEquipmentUpdated(
        req,
        itemId,
        "archived"
      );


      res.json({
        success: true,

        message:
          "Equipment archived. It is now hidden from borrowers.",
      });
    } catch (error) {
      console.error(
        "Archive item error:",
        error.message
      );


      res.status(
        500
      ).json({
        success: false,

        message:
          "Could not archive equipment.",
      });
    }
  };


// =====================================================
// RESTORE ITEM
// =====================================================

const restoreItem =
  async (
    req,
    res
  ) => {
    try {
      const itemId =
        req.params.id;


      const [result] =
        await database.query(
          `
          UPDATE items
          SET is_active = TRUE
          WHERE id = ?
          `,
          [
            itemId,
          ]
        );


      if (
        result.affectedRows ===
        0
      ) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Equipment not found.",
          });
      }


      emitEquipmentUpdated(
        req,
        itemId,
        "restored"
      );


      res.json({
        success: true,

        message:
          "Equipment restored and available again.",
      });
    } catch (error) {
      console.error(
        "Restore item error:",
        error.message
      );


      res.status(
        500
      ).json({
        success: false,

        message:
          "Could not restore equipment.",
      });
    }
  };


// =====================================================
// PERMANENT DELETE ITEM
//
// If reservation history exists, deletion is blocked.
// =====================================================

const deleteItem =
  async (
    req,
    res
  ) => {
    try {
      const itemId =
        req.params.id;


      const [items] =
        await database.query(
          `
          SELECT
            id,
            name
          FROM items
          WHERE id = ?
          LIMIT 1
          `,
          [
            itemId,
          ]
        );


      if (
        items.length ===
        0
      ) {
        return res
          .status(404)
          .json({
            success:
              false,

            message:
              "Equipment not found.",
          });
      }


      const [history] =
        await database.query(
          `
          SELECT COUNT(*) AS total
          FROM reservation_items
          WHERE item_id = ?
          `,
          [
            itemId,
          ]
        );


      if (
        Number(
          history[0].total
        ) > 0
      ) {
        return res
          .status(409)
          .json({
            success:
              false,

            message:
              "This equipment already has reservation history and cannot be permanently deleted. Archive it instead.",
          });
      }


      await database.query(
        `
        DELETE FROM items
        WHERE id = ?
        `,
        [
          itemId,
        ]
      );


      emitEquipmentUpdated(
        req,
        itemId,
        "deleted"
      );


      res.json({
        success: true,

        message:
          "Equipment permanently deleted.",
      });
    } catch (error) {
      console.error(
        "Delete equipment error:",
        error.message
      );


      res.status(
        500
      ).json({
        success: false,

        message:
          "Could not permanently delete equipment.",
      });
    }
  };


module.exports = {
  getAllItems,
  getActiveItems,
  addItem,
  updateItem,
  archiveItem,
  restoreItem,
  deleteItem,
};