# Repair Room Equipment Reservation System

A web-based equipment reservation and inventory management system for the **Repair Room – CMOB Department**.

The system allows borrowers to reserve available equipment online while Staff can review requests, manage inventory, release equipment, monitor borrowed items, process returns, and maintain reservation records.

---

## System Overview

The system has two separate sides:

### Client / Borrower Portal

Borrowers do not need an account.

They can:

- View available equipment
- Select reservation date and time
- Check equipment availability
- Submit a reservation request
- Track a reservation using its reference number
- Receive live reservation status updates
- View School ID deposit/return status
- Continue unfinished reservation forms after refreshing the browser

### Staff Portal

Staff accounts are protected by login.

Staff can:

- View dashboard statistics
- Receive real-time reservation notifications
- Review reservation requests
- Approve or reject requests
- Confirm physical form completion
- Confirm School ID deposit
- Release equipment
- Monitor borrowed equipment
- Process equipment returns
- Confirm School ID return
- Manage equipment inventory
- Search and filter equipment by category
- Archive and restore equipment
- Export reservation records
- Update Staff name and password

---

# Reservation Workflow

```text
Borrower submits reservation
        ↓
Staff reviews request
        ↓
Approved
        ↓
Borrower completes physical form/signatures
        ↓
Staff marks Physical Form Signed
        ↓
Borrower leaves School ID
        ↓
Staff confirms ID Deposited
        ↓
Staff releases equipment
        ↓
Equipment appears under Borrowed Items
        ↓
Borrower returns equipment
        ↓
Staff confirms Equipment Returned
        ↓
Staff returns School ID
        ↓
Staff completes return
        ↓
Equipment becomes available again
