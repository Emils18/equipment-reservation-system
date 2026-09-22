# Repair Room Equipment Reservation System

A web-based equipment reservation and inventory management system for the **Repair Room – CMOB Department**.

The system allows borrowers to reserve equipment online while Staff can review requests, manage inventory, release equipment, monitor borrowed items, process returns, and maintain reservation records.

---

## Main Features

### Client / Borrower

- View available equipment
- Select reservation date and time
- Real-time equipment availability checking
- Prevent overlapping reservations
- Submit equipment reservations
- Save unfinished reservation forms automatically
- Receive a unique reference number
- Track reservation status
- View Staff messages
- View School ID deposit and return status
- Receive real-time updates

### Staff

- Secure Staff login
- Dashboard with reservation statistics
- Real-time reservation notifications
- Approve or reject requests
- Confirm physical form completion
- Confirm School ID deposit
- Release equipment
- Monitor currently borrowed equipment
- Detect overdue reservations
- Process equipment returns
- Confirm School ID return
- Manage equipment inventory
- Search equipment
- Filter equipment by category
- Create, edit, archive, restore, and delete equipment
- Export reservation records to Excel/PDF
- Update Staff account information

---

## Reservation Workflow

```text
Borrower Submits Reservation
        ↓
Pending
        ↓
Staff Approves
        ↓
Physical Form / Signatures Completed
        ↓
Finalized
        ↓
School ID Deposited
        ↓
Equipment Released
        ↓
Borrowed
        ↓
Equipment Returned
        ↓
School ID Returned
        ↓
Return Completed
```

---

## Reservation Statuses

```text
pending
approved
finalized
released
returned
rejected
cancelled
```

Reservations with the following statuses block overlapping bookings:

```text
pending
approved
finalized
released
```

Equipment marked as `damaged`, `maintenance`, or archived is unavailable to borrowers.

---

## Technology Stack

### Frontend

- React
- Vite
- Tailwind CSS
- Axios
- React Router
- Socket.IO Client
- jsPDF
- XLSX

### Backend

- Node.js
- Express
- Socket.IO
- JSON Web Token
- MySQL2

### Database

- MariaDB / MySQL

---

## Project Structure

```text
equipment-reservation-system
│
├── client
│   └── src
│       ├── components
│       ├── pages
│       │   ├── borrower
│       │   └── staff
│       └── services
│
├── server
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── routes
│   └── server.js
│
├── database
│   └── schema.sql
│
└── README.md
```

---

# Installation

## Requirements

Install:

- Node.js
- npm
- Git
- MariaDB or MySQL

Clone the repository:

```cmd
cd /D C:\
git clone https://github.com/Emils18/equipment-reservation-system.git
cd C:\equipment-reservation-system
```

Install backend dependencies:

```cmd
cd server
npm install
```

Install frontend dependencies:

```cmd
cd ..\client
npm install
```

---

## Database Setup

Create the database:

```cmd
mysql -u root -e "CREATE DATABASE IF NOT EXISTS equipment_reservation;"
```

Import the schema:

```cmd
mysql -u root equipment_reservation < C:\equipment-reservation-system\database\schema.sql
```

For MariaDB, replace `mysql` with `mariadb`.

---

## Server Environment

Create:

```text
server/.env
```

Example:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=equipment_reservation

PORT=5000
CLIENT_URL=http://localhost:5173

JWT_SECRET=YOUR_RANDOM_SECRET
```

Generate a JWT secret:

```cmd
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Client Environment

Create:

```text
client/.env
```

Contents:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SERVER_URL=http://localhost:5000
```

---

# Running the System

Open two Command Prompt windows.

### Backend

```cmd
cd /D C:\equipment-reservation-system\server
npm start
```

### Frontend

```cmd
cd /D C:\equipment-reservation-system\client
npm run dev
```

Open:

```text
http://localhost:5173
```

---

## Main URLs

Borrower:

```text
http://localhost:5173/borrow
```

Track Reservation:

```text
http://localhost:5173/track
```

Staff Login:

```text
http://localhost:5173/staff/login
```

Staff Dashboard:

```text
http://localhost:5173/staff/dashboard
```

---

# Local Network Setup

Find the main/server PC IP:

```cmd
ipconfig
```

Example:

```text
192.168.1.100
```

Update `client/.env`:

```env
VITE_API_URL=http://192.168.1.100:5000/api
VITE_SERVER_URL=http://192.168.1.100:5000
```

Update `server/.env`:

```env
CLIENT_URL=http://192.168.1.100:5173
```

Run the frontend for LAN access:

```cmd
cd /D C:\equipment-reservation-system\client
npm run dev -- --host 0.0.0.0
```

Other computers on the same network can open:

```text
http://192.168.1.100:5173
```

Replace the IP address with the actual server PC address.

---

# Updating from GitHub

On the development PC:

```cmd
git add .
git commit -m "Update system"
git push origin main
```

On the server/school PC:

```cmd
cd /D C:\equipment-reservation-system
git pull origin main
```

Restart the frontend and backend after updating.

---

# Database Backup

Backup:

```cmd
mysqldump -u root equipment_reservation > equipment_reservation_backup.sql
```

Restore:

```cmd
mysql -u root equipment_reservation < equipment_reservation_backup.sql
```

---

# Important Security

Do not upload these files:

```text
client/.env
server/.env
node_modules
client/dist
```

Recommended `.gitignore`:

```gitignore
node_modules/
client/node_modules/
server/node_modules/

.env
client/.env
server/.env

client/dist/

*.log
npm-debug.log*

.vscode/
.DS_Store
Thumbs.db
```

---

## Credits

Developed as an academic system project by:

**Emelio Mondares**  
BSIT – 4th Year

---

## Repository

```text
https://github.com/Emils18/equipment-reservation-system
```

**Repair Room Equipment Reservation System — CMOB Department**
