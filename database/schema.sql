-- =====================================================
-- Equipment Reservation System
-- Complete Database Schema
-- MariaDB / MySQL
-- =====================================================

USE equipment_reservation;


-- =====================================================
-- STAFF
-- =====================================================

CREATE TABLE IF NOT EXISTS staff (
    id INT AUTO_INCREMENT PRIMARY KEY,

    full_name VARCHAR(100) NOT NULL,

    password VARCHAR(255) NOT NULL,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP

) ENGINE=InnoDB;


-- =====================================================
-- ITEMS
-- =====================================================

CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    category VARCHAR(100),

    asset_code VARCHAR(50) UNIQUE,

    description TEXT,

    condition_status ENUM(
        'good',
        'damaged',
        'maintenance'
    ) DEFAULT 'good',

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP

) ENGINE=InnoDB;


-- =====================================================
-- RESERVATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,

    reference_code VARCHAR(30)
        NOT NULL
        UNIQUE,

    date_filed DATE NOT NULL,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    start_time TIME,
    end_time TIME,

    department VARCHAR(150)
        NOT NULL,

    subject VARCHAR(150),

    location VARCHAR(150),

    purpose TEXT NOT NULL,

    requester_name VARCHAR(150)
        NOT NULL,

    school_id VARCHAR(50),

    instructor_name VARCHAR(150),

    borrower_confirmed BOOLEAN
        DEFAULT FALSE,

    -- School ID left at office before equipment release
    id_deposited BOOLEAN
        NOT NULL
        DEFAULT FALSE,

    id_deposited_at DATETIME NULL,

    -- School ID returned when equipment comes back
    id_returned BOOLEAN
        NOT NULL
        DEFAULT FALSE,

    id_returned_at DATETIME NULL,

    status ENUM(
        'pending',
        'approved',
        'finalized',
        'released',
        'returned',
        'rejected',
        'cancelled'
    ) DEFAULT 'pending',

    staff_message TEXT,

    approved_by INT NULL,

    approved_at DATETIME NULL,

    finalized_by INT NULL,

    finalized_at DATETIME NULL,

    released_at DATETIME NULL,

    returned_at DATETIME NULL,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,


    INDEX idx_reservation_dates (
        start_date,
        end_date
    ),

    INDEX idx_reservation_status (
        status
    ),


    FOREIGN KEY (
        approved_by
    )
    REFERENCES staff(id)
    ON DELETE SET NULL,


    FOREIGN KEY (
        finalized_by
    )
    REFERENCES staff(id)
    ON DELETE SET NULL

) ENGINE=InnoDB;


-- =====================================================
-- RESERVATION ITEMS
-- =====================================================

CREATE TABLE IF NOT EXISTS reservation_items (
    id INT AUTO_INCREMENT PRIMARY KEY,

    reservation_id INT NOT NULL,

    item_id INT NOT NULL,

    quantity INT DEFAULT 1,


    INDEX idx_reservation_item (
        item_id
    ),


    UNIQUE KEY unique_reservation_item (
        reservation_id,
        item_id
    ),


    FOREIGN KEY (
        reservation_id
    )
    REFERENCES reservations(id)
    ON DELETE CASCADE,


    FOREIGN KEY (
        item_id
    )
    REFERENCES items(id)
    ON DELETE RESTRICT

) ENGINE=InnoDB;


-- =====================================================
-- STATUS HISTORY
-- =====================================================

CREATE TABLE IF NOT EXISTS status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,

    reservation_id INT NOT NULL,

    status VARCHAR(50) NOT NULL,

    note TEXT,

    changed_by INT NULL,

    created_at TIMESTAMP
        DEFAULT CURRENT_TIMESTAMP,


    INDEX idx_history_reservation (
        reservation_id
    ),


    FOREIGN KEY (
        reservation_id
    )
    REFERENCES reservations(id)
    ON DELETE CASCADE,


    FOREIGN KEY (
        changed_by
    )
    REFERENCES staff(id)
    ON DELETE SET NULL

) ENGINE=InnoDB;