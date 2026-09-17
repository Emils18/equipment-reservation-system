// =====================================================
// Staff Panel Controller
// Dashboard, requests, borrowed items, and records
// =====================================================

const database = require("../config/database");

// Reusable query part for equipment names
const itemNamesQuery = `
  (
    SELECT GROUP_CONCAT(
      CONCAT(
        i.name,
        CASE
          WHEN i.asset_code IS NOT NULL
          THEN CONCAT(' (', i.asset_code, ')')
          ELSE ''
        END
      )
      ORDER BY i.name
      SEPARATOR ', '
    )
    FROM reservation_items ri
    JOIN items i
      ON i.id = ri.item_id
    WHERE ri.reservation_id = r.id
  )
`;


// =====================================================
// DASHBOARD
// =====================================================

const getDashboard = async (
  req,
  res
) => {
  try {
    const [counts] =
      await database.query(`
        SELECT
          (
            SELECT COUNT(*)
            FROM reservations
            WHERE status = 'pending'
          ) AS pending,

          (
            SELECT COUNT(*)
            FROM reservations
            WHERE status = 'approved'
          ) AS approved,

          (
            SELECT COUNT(*)
            FROM reservations
            WHERE status = 'released'
          ) AS borrowed,

          (
            SELECT COUNT(*)
            FROM reservations
            WHERE status = 'released'
              AND end_date < CURDATE()
          ) AS overdue,

          (
            SELECT COUNT(*)
            FROM items
            WHERE is_active = TRUE
          ) AS equipment
      `);

    const [recent] =
      await database.query(`
        SELECT
          r.id,
          r.reference_code,
          r.requester_name,
          r.department,
          r.start_date,
          r.status,
          ${itemNamesQuery} AS items
        FROM reservations r
        ORDER BY r.created_at DESC
        LIMIT 6
      `);

    res.json({
      success: true,
      ...counts[0],
      recent,
    });
  } catch (error) {
    console.error(
      "Dashboard error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Could not load dashboard.",
    });
  }
};


// =====================================================
// ACTIVE REQUESTS
// Pending -> Approved -> Finalized
// =====================================================

const getRequests = async (
  req,
  res
) => {
  try {
    const [requests] =
      await database.query(`
        SELECT
          r.*,
          ${itemNamesQuery} AS items
        FROM reservations r
        WHERE r.status IN (
          'pending',
          'approved',
          'finalized'
        )
        ORDER BY r.created_at DESC
      `);

    res.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error(
      "Requests error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Could not load requests.",
    });
  }
};


// =====================================================
// BORROWED ITEMS
// =====================================================

const getBorrowed = async (
  req,
  res
) => {
  try {
    const [borrowed] =
      await database.query(`
        SELECT
          r.*,
          ${itemNamesQuery} AS items,

          CASE
            WHEN r.end_date < CURDATE()
            THEN TRUE
            ELSE FALSE
          END AS is_overdue

        FROM reservations r

        WHERE r.status = 'released'

        ORDER BY
          is_overdue DESC,
          r.end_date ASC
      `);

    res.json({
      success: true,
      borrowed,
    });
  } catch (error) {
    console.error(
      "Borrowed error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Could not load borrowed items.",
    });
  }
};


// =====================================================
// RECORDS
// =====================================================

const getRecords = async (
  req,
  res
) => {
  try {
    const {
      from,
      to,
      department,
      status,
    } = req.query;

    const conditions = [];
    const values = [];

    if (from) {
      conditions.push(
        "r.start_date >= ?"
      );

      values.push(from);
    }

    if (to) {
      conditions.push(
        "r.start_date <= ?"
      );

      values.push(to);
    }

    if (department) {
      conditions.push(
        "r.department LIKE ?"
      );

      values.push(
        `%${department}%`
      );
    }

    if (status) {
      conditions.push(
        "r.status = ?"
      );

      values.push(status);
    }

    const where =
      conditions.length > 0
        ? `WHERE ${conditions.join(
            " AND "
          )}`
        : "";

    const [records] =
      await database.query(
        `
        SELECT
          r.*,
          ${itemNamesQuery} AS items
        FROM reservations r
        ${where}
        ORDER BY r.created_at DESC
        `,
        values
      );

    res.json({
      success: true,
      records,
    });
  } catch (error) {
    console.error(
      "Records error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Could not load records.",
    });
  }
};


// =====================================================
// UPDATE RESERVATION STATUS
// =====================================================

const updateReservationStatus =
  async (req, res) => {
    const connection =
      await database.getConnection();

    try {
      const reservationId =
        req.params.id;

      const {
        status,
        message,
      } = req.body;

      const allowedTransitions = {
        pending: [
          "approved",
          "rejected",
          "cancelled",
        ],

        approved: [
          "finalized",
          "cancelled",
        ],

        finalized: [
          "released",
          "cancelled",
        ],

        released: [
          "returned",
        ],
      };

      await connection.beginTransaction();

      const [rows] =
        await connection.query(
          `
          SELECT *
          FROM reservations
          WHERE id = ?
          FOR UPDATE
          `,
          [reservationId]
        );

      if (rows.length === 0) {
        await connection.rollback();

        return res.status(404).json({
          success: false,
          message:
            "Reservation not found.",
        });
      }

      const reservation = rows[0];

      const permitted =
        allowedTransitions[
          reservation.status
        ] || [];

      if (
        !permitted.includes(status)
      ) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: `Cannot change ${reservation.status} to ${status}.`,
        });
      }

      const updates = [
        "status = ?",
      ];

      const values = [status];

      if (
        message !== undefined
      ) {
        updates.push(
          "staff_message = ?"
        );

        values.push(
          message || null
        );
      }

      if (status === "approved") {
        updates.push(
          "approved_by = ?",
          "approved_at = NOW()"
        );

        values.push(
          req.staff.id
        );
      }

      if (status === "finalized") {
        updates.push(
          "finalized_by = ?",
          "finalized_at = NOW()"
        );

        values.push(
          req.staff.id
        );
      }

      if (status === "released") {
        updates.push(
          "released_at = NOW()"
        );
      }

      if (status === "returned") {
        updates.push(
          "returned_at = NOW()"
        );
      }

      values.push(
        reservationId
      );

      await connection.query(
        `
        UPDATE reservations
        SET ${updates.join(", ")}
        WHERE id = ?
        `,
        values
      );

      await connection.query(
        `
        INSERT INTO status_history
        (
          reservation_id,
          status,
          note,
          changed_by
        )
        VALUES (?, ?, ?, ?)
        `,
        [
          reservationId,
          status,
          message || null,
          req.staff.id,
        ]
      );

      await connection.commit();

      const io =
        req.app.get("io");

      if (io) {
        io.emit(
          "reservation_updated",
          {
            id: Number(
              reservationId
            ),
            status,
          }
        );
      }

      res.json({
        success: true,
        message:
          "Reservation updated successfully.",
      });
    } catch (error) {
      await connection.rollback();

      console.error(
        "Status update error:",
        error.message
      );

      res.status(500).json({
        success: false,
        message:
          "Could not update reservation.",
      });
    } finally {
      connection.release();
    }
  };

module.exports = {
  getDashboard,
  getRequests,
  getBorrowed,
  getRecords,
  updateReservationStatus,
};