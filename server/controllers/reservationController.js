// =====================================================
// Public Reservation Controller
//
// Used by borrowers to:
// - View equipment
// - Check schedule availability
// - Submit reservation requests
// - Track reservation status
// =====================================================

const crypto = require("crypto");

const database = require("../config/database");


// =====================================================
// TIME HELPER
// =====================================================

const normalizeTime = (
  time,
  fallback
) => {
  if (!time) {
    return fallback;
  }

  // HTML time input normally gives HH:MM
  if (time.length === 5) {
    return `${time}:00`;
  }

  return time;
};


// =====================================================
// DATE/TIME HELPER
// =====================================================

const getScheduleValues = ({
  start_date,
  end_date,
  start_time,
  end_time,
}) => {
  const normalizedStartTime =
    normalizeTime(
      start_time,
      "00:00:00"
    );

  const normalizedEndTime =
    normalizeTime(
      end_time,
      "23:59:59"
    );

  return {
    startDateTime:
      `${start_date} ${normalizedStartTime}`,

    endDateTime:
      `${end_date} ${normalizedEndTime}`,
  };
};


// =====================================================
// CHECK CONFLICTS
//
// Can use normal database pool or an active transaction.
// =====================================================

const findConflicts = async (
  db,
  itemIds,
  schedule
) => {
  if (
    !Array.isArray(itemIds) ||
    itemIds.length === 0
  ) {
    return [];
  }

  const placeholders =
    itemIds
      .map(() => "?")
      .join(",");

  const {
    startDateTime,
    endDateTime,
  } = getScheduleValues(
    schedule
  );

  const [conflicts] =
    await db.query(
      `
      SELECT
        ri.item_id,

        i.name AS item_name,
        i.asset_code,

        r.id AS reservation_id,
        r.reference_code,

        r.start_date,
        r.end_date,
        r.start_time,
        r.end_time,

        r.status

      FROM reservation_items ri

      INNER JOIN reservations r
        ON r.id = ri.reservation_id

      INNER JOIN items i
        ON i.id = ri.item_id

      WHERE ri.item_id IN (${placeholders})

        AND r.status IN (
          'pending',
          'approved',
          'finalized',
          'released'
        )

        AND TIMESTAMP(
          r.start_date,
          COALESCE(
            r.start_time,
            '00:00:00'
          )
        ) <= ?

        AND TIMESTAMP(
          r.end_date,
          COALESCE(
            r.end_time,
            '23:59:59'
          )
        ) >= ?

      ORDER BY
        r.start_date ASC,
        r.start_time ASC
      `,
      [
        ...itemIds,
        endDateTime,
        startDateTime,
      ]
    );

  return conflicts;
};


// =====================================================
// BORROWER EQUIPMENT CATALOG
//
// Shows only non-archived equipment.
//
// Also returns upcoming reservation schedules so the
// borrower can see when equipment is already requested.
// =====================================================

const getCatalog = async (
  req,
  res
) => {
  try {
    const [items] =
      await database.query(`
        SELECT
          id,
          name,
          category,
          asset_code,
          description,
          condition_status,
          is_active
        FROM items
        WHERE is_active = TRUE
        ORDER BY
          name ASC,
          asset_code ASC
      `);


    const [schedules] =
      await database.query(`
        SELECT
          ri.item_id,

          r.reference_code,
          r.start_date,
          r.end_date,
          r.start_time,
          r.end_time,
          r.status

        FROM reservation_items ri

        INNER JOIN reservations r
          ON r.id = ri.reservation_id

        WHERE r.status IN (
          'pending',
          'approved',
          'finalized',
          'released'
        )

        AND r.end_date >= CURDATE()

        ORDER BY
          r.start_date ASC,
          r.start_time ASC
      `);


    const catalog =
      items.map((item) => ({
        ...item,

        schedules:
          schedules.filter(
            (schedule) =>
              Number(
                schedule.item_id
              ) ===
              Number(item.id)
          ),
      }));


    res.json({
      success: true,
      items: catalog,
    });
  } catch (error) {
    console.error(
      "Borrower catalog error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Could not load equipment.",
    });
  }
};


// =====================================================
// CHECK AVAILABILITY
//
// Called automatically when borrower chooses dates/time.
// =====================================================

const checkAvailability = async (
  req,
  res
) => {
  try {
    const {
      item_ids,
      start_date,
      end_date,
      start_time,
      end_time,
    } = req.body;


    if (
      !Array.isArray(item_ids) ||
      item_ids.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "No equipment was provided.",
      });
    }


    if (
      !start_date ||
      !end_date ||
      !start_time ||
      !end_time
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Complete the reservation start and end date/time first.",
      });
    }


    const {
      startDateTime,
      endDateTime,
    } = getScheduleValues({
      start_date,
      end_date,
      start_time,
      end_time,
    });


    if (
      endDateTime <=
      startDateTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Reservation end date/time must be after the start date/time.",
      });
    }


    const uniqueItemIds = [
      ...new Set(
        item_ids
          .map(Number)
          .filter(
            Number.isFinite
          )
      ),
    ];


    if (
      uniqueItemIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "No valid equipment was provided.",
      });
    }


    const conflicts =
      await findConflicts(
        database,
        uniqueItemIds,
        {
          start_date,
          end_date,
          start_time,
          end_time,
        }
      );


    // Check whether an item is archived, damaged,
    // or currently under maintenance.
    const placeholders =
      uniqueItemIds
        .map(
          () => "?"
        )
        .join(",");


    const [equipment] =
      await database.query(
        `
        SELECT
          id,
          name,
          asset_code,
          condition_status,
          is_active

        FROM items

        WHERE id IN (${placeholders})
        `,
        uniqueItemIds
      );


    const unavailable_items =
      equipment.filter(
        (item) =>
          !item.is_active ||
          item.condition_status !==
            "good"
      );


    res.json({
      success: true,
      conflicts,
      unavailable_items,
    });
  } catch (error) {
    console.error(
      "Availability error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Could not check equipment availability.",
    });
  }
};


// =====================================================
// CREATE RESERVATION
// =====================================================

const createReservation = async (
  req,
  res
) => {
  const connection =
    await database.getConnection();

  try {
    const {
      item_ids,

      start_date,
      end_date,

      start_time,
      end_time,

      department,
      subject,
      location,
      purpose,

      requester_name,
      school_id,
      instructor_name,

      borrower_confirmed,
    } = req.body;


    // =================================================
    // Basic validation
    // =================================================

    if (
      !Array.isArray(item_ids) ||
      item_ids.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Select at least one equipment item.",
      });
    }


    if (
      !start_date ||
      !end_date ||
      !start_time ||
      !end_time
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Reservation date and time are required.",
      });
    }


    if (
      !department ||
      !purpose ||
      !requester_name ||
      !school_id
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Complete all required borrower information.",
      });
    }


    if (!borrower_confirmed) {
      return res.status(400).json({
        success: false,
        message:
          "Please confirm that the submitted information is correct.",
      });
    }


    // =================================================
    // Validate schedule
    // =================================================

    const {
      startDateTime,
      endDateTime,
    } = getScheduleValues({
      start_date,
      end_date,
      start_time,
      end_time,
    });


    if (
      endDateTime <=
      startDateTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Reservation end date/time must be after the start date/time.",
      });
    }


    // =================================================
    // School Rule:
    // Reservation must be filed at least 3 days before
    // the requested date of use.
    // =================================================

    const today =
      new Date();

    today.setHours(
      0,
      0,
      0,
      0
    );


    const minimumDate =
      new Date(today);

    minimumDate.setDate(
      minimumDate.getDate() + 3
    );


    const requestedStart =
      new Date(
        `${start_date}T00:00:00`
      );


    if (
      requestedStart <
      minimumDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Reservations must be filed at least 3 days before the date of use.",
      });
    }


    // =================================================
    // Remove duplicate item IDs
    // =================================================

    const uniqueItemIds =
      [
        ...new Set(
          item_ids.map(Number)
        ),
      ];


    await connection.beginTransaction();


    // =================================================
    // Lock selected equipment rows
    //
    // This prevents two users from submitting the same
    // equipment for the same schedule at the same time.
    // =================================================

    const placeholders =
      uniqueItemIds
        .map(() => "?")
        .join(",");


    const [selectedItems] =
      await connection.query(
        `
        SELECT
          id,
          name,
          asset_code,
          condition_status,
          is_active

        FROM items

        WHERE id IN (${placeholders})

        FOR UPDATE
        `,
        uniqueItemIds
      );


    if (
      selectedItems.length !==
      uniqueItemIds.length
    ) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message:
          "One or more selected equipment items no longer exist.",
      });
    }


    // Archived, damaged, or maintenance equipment
    const invalidItem =
      selectedItems.find(
        (item) =>
          !item.is_active ||
          item.condition_status !==
            "good"
      );


    if (invalidItem) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message:
          `${invalidItem.name} is currently unavailable.`,
      });
    }


    // =================================================
    // Check conflicts again INSIDE transaction
    // =================================================

    const conflicts =
      await findConflicts(
        connection,
        uniqueItemIds,
        {
          start_date,
          end_date,
          start_time,
          end_time,
        }
      );


    if (conflicts.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        success: false,

        message:
          "One or more selected equipment items are already reserved for that schedule.",

        conflicts,
      });
    }


    // =================================================
    // Temporary unique reference
    //
    // We need the database ID before we can create the
    // final human-readable reference number.
    // =================================================

    const temporaryReference =
      `TEMP-${Date.now()}-${crypto
        .randomBytes(4)
        .toString("hex")}`;


    // =================================================
    // Insert reservation
    // =================================================

    const [result] =
      await connection.query(
        `
        INSERT INTO reservations
        (
          reference_code,

          date_filed,

          start_date,
          end_date,

          start_time,
          end_time,

          department,
          subject,
          location,
          purpose,

          requester_name,
          school_id,
          instructor_name,

          borrower_confirmed,

          status
        )
        VALUES
        (
          ?,
          CURDATE(),
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          TRUE,
          'pending'
        )
        `,
        [
          temporaryReference,

          start_date,
          end_date,

          normalizeTime(
            start_time,
            null
          ),

          normalizeTime(
            end_time,
            null
          ),

          department.trim(),

          subject?.trim() ||
            null,

          location?.trim() ||
            null,

          purpose.trim(),

          requester_name.trim(),

          school_id.trim(),

          instructor_name?.trim() ||
            null,
        ]
      );


    const reservationId =
      result.insertId;


    // =================================================
    // Generate final reference number
    //
    // Example:
    // RES-2026-00001
    // =================================================

    const year =
      new Date().getFullYear();


    const referenceCode =
      `RES-${year}-${String(
        reservationId
      ).padStart(5, "0")}`;


    await connection.query(
      `
      UPDATE reservations
      SET reference_code = ?
      WHERE id = ?
      `,
      [
        referenceCode,
        reservationId,
      ]
    );


    // =================================================
    // Connect equipment to reservation
    // =================================================

    for (
      const itemId of uniqueItemIds
    ) {
      await connection.query(
        `
        INSERT INTO reservation_items
        (
          reservation_id,
          item_id,
          quantity
        )
        VALUES (?, ?, 1)
        `,
        [
          reservationId,
          itemId,
        ]
      );
    }


    // =================================================
    // Initial audit/history record
    // =================================================

    await connection.query(
      `
      INSERT INTO status_history
      (
        reservation_id,
        status,
        note,
        changed_by
      )
      VALUES
      (
        ?,
        'pending',
        ?,
        NULL
      )
      `,
      [
        reservationId,
        "Reservation submitted online by borrower.",
      ]
    );


    await connection.commit();


    // =================================================
    // Notify Staff Panel in real-time
    // =================================================

    const io =
      req.app.get("io");


    if (io) {
      io.emit(
        "reservation_created",
        {
          id:
            reservationId,

          reference_code:
            referenceCode,
        }
      );
    }


    res.status(201).json({
      success: true,

      message:
        "Reservation request submitted successfully.",

      reference_code:
        referenceCode,
    });
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // Ignore rollback error
    }

    console.error(
      "Create reservation error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Could not submit reservation request.",
    });
  } finally {
    connection.release();
  }
};


// =====================================================
// TRACK RESERVATION
// =====================================================

const trackReservation = async (
  req,
  res
) => {
  try {
    const referenceCode =
      req.params.referenceCode
        ?.trim()
        .toUpperCase();


    if (!referenceCode) {
      return res.status(400).json({
        success: false,
        message:
          "Reference number is required.",
      });
    }


    const [rows] =
      await database.query(
        `
        SELECT *
        FROM reservations
        WHERE UPPER(reference_code) = ?
        LIMIT 1
        `,
        [referenceCode]
      );


    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message:
          "Reservation reference was not found.",
      });
    }


    const reservation =
      rows[0];


    // Equipment
    const [items] =
      await database.query(
        `
        SELECT
          i.id,
          i.name,
          i.category,
          i.asset_code,
          i.description,
          i.condition_status,
          ri.quantity

        FROM reservation_items ri

        INNER JOIN items i
          ON i.id = ri.item_id

        WHERE ri.reservation_id = ?

        ORDER BY i.name ASC
        `,
        [reservation.id]
      );


    // Status history
    const [history] =
      await database.query(
        `
        SELECT
          status,
          note,
          created_at

        FROM status_history

        WHERE reservation_id = ?

        ORDER BY created_at ASC
        `,
        [reservation.id]
      );


    res.json({
      success: true,

      reservation: {
        ...reservation,
        items,
        history,
      },
    });
  } catch (error) {
    console.error(
      "Track reservation error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Could not track reservation.",
    });
  }
};


module.exports = {
  getCatalog,
  checkAvailability,
  createReservation,
  trackReservation,
};