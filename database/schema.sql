-- =====================================================
-- Equipment Reservation System
-- Main Database Structure
-- Database: MariaDB / MySQL
-- =====================================================

-- The database itself is created during installation.
-- This file only creates the system tables.

USE equipment_reservation;


-- =====================================================
-- STAFF
-- Staff accounts used to access the admin panel
-- =====================================================

CREATE TABLE IF NOT EXISTS staff (
    id INT AUTO_INCREMENT PRIMARY KEY,

    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,

    -- Never store the actual password.
    -- The backend stores a secure hashed password here.
    password_hash VARCHAR(255) NOT NULL,

    -- Allows an account to be disabled without deleting it.
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

) ENGINE=InnoDB;


-- =====================================================
-- ITEMS
-- Equipment and materials that staff can manage
-- Examples:
-- Projector
-- HDMI Cable
-- Extension Cord
-- Speaker
-- =====================================================

CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Name shown to borrowers
    name VARCHAR(150) NOT NULL,

    -- Example:
    -- Projector
    -- Cable
    -- Audio Equipment
    category VARCHAR(100),

    -- Unique physical item code
    -- Example: PROJ-001
    asset_code VARCHAR(50) UNIQUE,

    -- Optional information about the item
    description TEXT,

    -- Physical condition of the item
    condition_status ENUM(
        'good',
        'damaged',
        'maintenance'
    ) DEFAULT 'good',

    -- False means hidden from borrowers.
    -- We keep the record so old reservation history remains.
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP

) ENGINE=InnoDB;


-- =====================================================
-- RESERVATIONS
-- Main online reservation form
-- Based on the school's physical reservation form
-- =====================================================

CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Public tracking/reference number
    -- Example: RES-2026-00001
    reference_code VARCHAR(30) NOT NULL UNIQUE,

    -- Date the online request was submitted
    date_filed DATE NOT NULL,

    -- Requested reservation period
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    -- Requested usage time
    start_time TIME,
    end_time TIME,

    -- Physical form information
    department VARCHAR(150) NOT NULL,
    subject VARCHAR(150),
    location VARCHAR(150),

    purpose TEXT NOT NULL,

    -- Person requesting the reservation
    requester_name VARCHAR(150) NOT NULL,

    -- School ID is required by the physical form
    school_id VARCHAR(50),

    -- Instructor connected to the request
    instructor_name VARCHAR(150),

    -- Online confirmation/signing step
    -- This means the borrower confirmed that
    -- the submitted information is correct.
    borrower_confirmed BOOLEAN DEFAULT FALSE,

    -- Reservation workflow:
    --
    -- pending
    -- Staff has not reviewed the request yet.
    --
    -- approved
    -- Staff approved it online.
    -- Borrower must proceed to the Repair Room.
    --
    -- finalized
    -- Physical form/signatures have been completed.
    --
    -- released
    -- Equipment was physically released.
    --
    -- returned
    -- Equipment was returned.
    --
    -- rejected
    -- Staff rejected the request.
    --
    -- cancelled
    -- Reservation was cancelled.
    status ENUM(
        'pending',
        'approved',
        'finalized',
        'released',
        'returned',
        'rejected',
        'cancelled'
    ) DEFAULT 'pending',

    -- Staff can send a message to the borrower.
    -- Example:
    -- "Approved. Please proceed to the Repair Room
    -- to complete the physical form and signatures."
    staff_message TEXT,

    -- Staff member who approved the request
    approved_by INT NULL,
    approved_at DATETIME NULL,

    -- Staff member who finalized the physical reservation
    finalized_by INT NULL,
    finalized_at DATETIME NULL,

    -- Actual equipment release time
    released_at DATETIME NULL,

    -- Actual equipment return time
    returned_at DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    -- Used when checking reservation date conflicts
    INDEX idx_reservation_dates (
        start_date,
        end_date
    ),

    -- Used by the admin dashboard
    INDEX idx_reservation_status (
        status
    ),

    FOREIGN KEY (approved_by)
        REFERENCES staff(id)
        ON DELETE SET NULL,

    FOREIGN KEY (finalized_by)
        REFERENCES staff(id)
        ON DELETE SET NULL

) ENGINE=InnoDB;


-- =====================================================
-- RESERVATION ITEMS
-- Connects equipment/items to a reservation
--
-- A reservation can contain more than one item.
-- Example:
-- Projector + HDMI Cable + Extension Cord
-- =====================================================

CREATE TABLE IF NOT EXISTS reservation_items (
    id INT AUTO_INCREMENT PRIMARY KEY,

    reservation_id INT NOT NULL,
    item_id INT NOT NULL,

    -- Normally 1 when every physical item has
    -- its own asset code.
    quantity INT DEFAULT 1,

    -- Speeds up availability/conflict checking
    INDEX idx_reservation_item (
        item_id
    ),

    -- Prevent accidentally adding the exact same
    -- item twice to one reservation.
    UNIQUE KEY unique_reservation_item (
        reservation_id,
        item_id
    ),

    FOREIGN KEY (reservation_id)
        REFERENCES reservations(id)
        ON DELETE CASCADE,

    FOREIGN KEY (item_id)
        REFERENCES items(id)
        ON DELETE RESTRICT

) ENGINE=InnoDB;


-- =====================================================
-- STATUS HISTORY
-- Records every important reservation status change
--
-- This gives staff a soft-copy history/audit trail.
-- =====================================================

CREATE TABLE IF NOT EXISTS status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,

    reservation_id INT NOT NULL,

    -- Example:
    -- pending
    -- approved
    -- finalized
    -- released
    -- returned
    -- rejected
    -- cancelled
    status VARCHAR(50) NOT NULL,

    -- Optional explanation/message
    -- Example:
    -- "Approved. Proceed to Repair Room."
    note TEXT,

    -- Staff member who made the change.
    -- NULL is allowed for system-generated changes.
    changed_by INT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_history_reservation (
        reservation_id
    ),

    FOREIGN KEY (reservation_id)
        REFERENCES reservations(id)
        ON DELETE CASCADE,

    FOREIGN KEY (changed_by)
        REFERENCES staff(id)
        ON DELETE SET NULL

) ENGINE=InnoDB;