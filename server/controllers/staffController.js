// =====================================================
// Staff Panel Controller
// Dashboard, requests, borrowed items, records,
// School ID deposit, release, and return workflow
// =====================================================

const database = require("../config/database");


// =====================================================
// Reusable Equipment Names Query
// =====================================================

const itemNamesQuery = `
  (
    SELECT GROUP_CONCAT(
      CONCAT(
        i.name,

        CASE
          WHEN i.asset_code IS NOT NULL
          THEN CONCAT(
            ' (',
            i.asset_code,
            ')'
          )
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
// Emit Reservation Update
// =====================================================

const emitReservationUpdate = (
  req,
  reservationId,
  payload = {}
) => {
  const io =
    req.app.get("io");

  if (!io) {
    return;
  }

  io.emit(
    "reservation_updated",
    {
      id:
        Number(
          reservationId
        ),

      ...payload,
    }
  );
};


// =====================================================
// DASHBOARD
// =====================================================

const getDashboard =
  async (
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

                AND TIMESTAMP(
                  end_date,
                  COALESCE(
                    end_time,
                    '23:59:59'
                  )
                ) < NOW()
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
            r.start_time,
            r.end_date,
            r.end_time,
            r.status,

            ${itemNamesQuery}
              AS items

          FROM reservations r

          ORDER BY
            r.created_at DESC

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
// =====================================================

const getRequests =
  async (
    req,
    res
  ) => {
    try {
      const [requests] =
        await database.query(`
          SELECT
            r.*,

            ${itemNamesQuery}
              AS items

          FROM reservations r

          WHERE r.status IN (
            'pending',
            'approved',
            'finalized'
          )

          ORDER BY
            r.created_at DESC
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

const getBorrowed =
  async (
    req,
    res
  ) => {
    try {
      const [borrowed] =
        await database.query(`
          SELECT
            r.*,

            ${itemNamesQuery}
              AS items,

            CASE
              WHEN TIMESTAMP(
                r.end_date,
                COALESCE(
                  r.end_time,
                  '23:59:59'
                )
              ) < NOW()
              THEN TRUE
              ELSE FALSE
            END AS is_overdue

          FROM reservations r

          WHERE r.status = 'released'

          ORDER BY
            is_overdue DESC,
            r.end_date ASC,
            r.end_time ASC
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

const getRecords =
  async (
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

        values.push(
          from
        );
      }


      if (to) {
        conditions.push(
          "r.start_date <= ?"
        );

        values.push(
          to
        );
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

        values.push(
          status
        );
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

            ${itemNamesQuery}
              AS items

          FROM reservations r

          ${where}

          ORDER BY
            r.created_at DESC
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
//
// pending -> approved/rejected/cancelled
// approved -> finalized/cancelled
// finalized -> released/cancelled
//
// returned is handled by completeReturn()
// =====================================================

const updateReservationStatus =
  async (
    req,
    res
  ) => {
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
          [
            reservationId,
          ]
        );


      if (
        rows.length ===
        0
      ) {
        await connection.rollback();


        return res
          .status(404)
          .json({
            success: false,

            message:
              "Reservation not found.",
          });
      }


      const reservation =
        rows[0];


      const permitted =
        allowedTransitions[
          reservation.status
        ] || [];


      if (
        !permitted.includes(
          status
        )
      ) {
        await connection.rollback();


        return res
          .status(400)
          .json({
            success: false,

            message:
              `Cannot change ${reservation.status} to ${status}.`,
          });
      }


      // ===============================================
      // ID must be deposited before release
      // ===============================================

      if (
        status ===
          "released" &&
        !reservation.id_deposited
      ) {
        await connection.rollback();


        return res
          .status(400)
          .json({
            success: false,

            message:
              "Confirm that the borrower deposited their School ID before releasing the equipment.",
          });
      }


      const updates = [
        "status = ?",
      ];

      const values = [
        status,
      ];


      if (
        message !==
        undefined
      ) {
        updates.push(
          "staff_message = ?"
        );

        values.push(
          message ||
          null
        );
      }


      if (
        status ===
        "approved"
      ) {
        updates.push(
          "approved_by = ?",
          "approved_at = NOW()"
        );

        values.push(
          req.staff.id
        );
      }


      if (
        status ===
        "finalized"
      ) {
        updates.push(
          "finalized_by = ?",
          "finalized_at = NOW()"
        );

        values.push(
          req.staff.id
        );
      }


      if (
        status ===
        "released"
      ) {
        updates.push(
          "released_at = NOW()"
        );
      }


      values.push(
        reservationId
      );


      await connection.query(
        `
        UPDATE reservations

        SET
          ${updates.join(
            ", "
          )}

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

          message ||
            null,

          req.staff.id,
        ]
      );


      await connection.commit();


      emitReservationUpdate(
        req,
        reservationId,
        {
          status,
        }
      );


      res.json({
        success: true,

        message:
          "Reservation updated successfully.",
      });
    } catch (error) {
      try {
        await connection.rollback();
      } catch {
        // Ignore rollback failure
      }


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


// =====================================================
// CONFIRM SCHOOL ID DEPOSIT
//
// Only available after physical form has been signed.
// =====================================================

const confirmIdDeposit =
  async (
    req,
    res
  ) => {
    const connection =
      await database.getConnection();


    try {
      const reservationId =
        req.params.id;


      await connection.beginTransaction();


      const [rows] =
        await connection.query(
          `
          SELECT *
          FROM reservations
          WHERE id = ?
          FOR UPDATE
          `,
          [
            reservationId,
          ]
        );


      if (
        rows.length ===
        0
      ) {
        await connection.rollback();


        return res
          .status(404)
          .json({
            success: false,

            message:
              "Reservation not found.",
          });
      }


      const reservation =
        rows[0];


      if (
        reservation.status !==
        "finalized"
      ) {
        await connection.rollback();


        return res
          .status(400)
          .json({
            success: false,

            message:
              "The physical form must be completed before accepting the School ID.",
          });
      }


      if (
        reservation.id_deposited
      ) {
        await connection.rollback();


        return res.json({
          success: true,

          message:
            "School ID deposit is already confirmed.",
        });
      }


      await connection.query(
        `
        UPDATE reservations

        SET
          id_deposited = TRUE,
          id_deposited_at = NOW()

        WHERE id = ?
        `,
        [
          reservationId,
        ]
      );


      await connection.commit();


      emitReservationUpdate(
        req,
        reservationId,
        {
          status:
            reservation.status,

          id_deposited:
            true,
        }
      );


      res.json({
        success: true,

        message:
          "School ID deposit confirmed. Equipment can now be released.",
      });
    } catch (error) {
      try {
        await connection.rollback();
      } catch {
        // Ignore rollback failure
      }


      console.error(
        "ID deposit error:",
        error.message
      );


      res.status(500).json({
        success: false,

        message:
          "Could not confirm School ID deposit.",
      });
    } finally {
      connection.release();
    }
  };


// =====================================================
// COMPLETE RETURN
//
// Requires:
// 1. Equipment physically returned
// 2. School ID returned to borrower
// =====================================================

const completeReturn =
  async (
    req,
    res
  ) => {
    const connection =
      await database.getConnection();


    try {
      const reservationId =
        req.params.id;


      const {
        equipment_returned,
        id_returned,
        message,
      } = req.body;


      if (
        !equipment_returned ||
        !id_returned
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Confirm both the equipment return and the School ID return.",
          });
      }


      await connection.beginTransaction();


      const [rows] =
        await connection.query(
          `
          SELECT *
          FROM reservations
          WHERE id = ?
          FOR UPDATE
          `,
          [
            reservationId,
          ]
        );


      if (
        rows.length ===
        0
      ) {
        await connection.rollback();


        return res
          .status(404)
          .json({
            success: false,

            message:
              "Reservation not found.",
          });
      }


      const reservation =
        rows[0];


      if (
        reservation.status !==
        "released"
      ) {
        await connection.rollback();


        return res
          .status(400)
          .json({
            success: false,

            message:
              "Only released equipment can be returned.",
          });
      }


      if (
        !reservation.id_deposited
      ) {
        await connection.rollback();


        return res
          .status(400)
          .json({
            success: false,

            message:
              "This reservation has no confirmed School ID deposit.",
          });
      }


      const finalMessage =
        message?.trim() ||
        "Equipment and School ID have been returned successfully.";


      await connection.query(
        `
        UPDATE reservations

        SET
          status = 'returned',

          returned_at = NOW(),

          id_returned = TRUE,

          id_returned_at = NOW(),

          staff_message = ?

        WHERE id = ?
        `,
        [
          finalMessage,
          reservationId,
        ]
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

        VALUES (
          ?,
          'returned',
          ?,
          ?
        )
        `,
        [
          reservationId,

          finalMessage,

          req.staff.id,
        ]
      );


      await connection.commit();


      emitReservationUpdate(
        req,
        reservationId,
        {
          status:
            "returned",

          id_returned:
            true,
        }
      );


      res.json({
        success: true,

        message:
          "Return completed. Equipment is available again and the School ID was returned.",
      });
    } catch (error) {
      try {
        await connection.rollback();
      } catch {
        // Ignore rollback failure
      }


      console.error(
        "Complete return error:",
        error.message
      );


      res.status(500).json({
        success: false,

        message:
          "Could not complete the return.",
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
  confirmIdDeposit,
  completeReturn,
};