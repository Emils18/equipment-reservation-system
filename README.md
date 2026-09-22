Repair Room Equipment Reservation System

A web-based equipment reservation, borrowing, inventory, and return management system for the Repair Room – CMOB Department.

The system allows borrowers to reserve available equipment online while authorized staff can review requests, manage inventory, release equipment, monitor borrowed items, process returns, and maintain reservation records.

System Overview

The system has two main areas:

Client / Borrower Portal

Staff Portal

Borrowers do not need an account. The Staff Portal is protected by staff authentication.

Client / Borrower Portal

Borrowers can:

View available equipment

Search and select equipment

Choose reservation start and return date/time

Check equipment availability

Avoid overlapping reservations

Enter borrower information

Submit reservation requests

Receive a unique reservation reference number

Track a reservation using its reference number

Receive real-time status updates

View staff messages

View School ID deposit and return status

Continue an unfinished reservation after refreshing the browser

Client branding:

ER
Equipment Reservation
REPAIR ROOM • CMOB Department

Staff Portal

Authorized Repair Room / CMOB personnel can:

Log in using staff name and password

View dashboard statistics

Receive real-time reservation notifications

Review pending requests

Approve or reject requests

Confirm physical form completion

Confirm borrower School ID deposit

Release equipment

Monitor currently borrowed equipment

Detect overdue equipment

Confirm equipment return

Confirm School ID return

Complete the borrowing transaction

Create, view, edit, archive, restore, and delete equipment

Search equipment

Filter equipment by category

Export reservation records

Update staff account name

Change staff password

Staff branding:

RR
REPAIR ROOM
CMOB Department

Reservation Workflow

Borrower selects equipment
        ↓
Borrower chooses schedule
        ↓
System checks availability
        ↓
Borrower submits reservation
        ↓
Status: Pending
        ↓
Staff reviews request
        ↓
Staff approves
        ↓
Borrower completes physical form/signatures
        ↓
Staff marks Physical Form Signed
        ↓
Status: Finalized
        ↓
Borrower leaves School ID at Repair Room
        ↓
Staff confirms School ID Deposited
        ↓
Staff releases equipment
        ↓
Status: Released
        ↓
Equipment appears in Borrowed Items
        ↓
Borrower returns equipment
        ↓
Staff confirms Equipment Returned
        ↓
Staff returns School ID
        ↓
Staff confirms School ID Returned
        ↓
Staff completes return
        ↓
Status: Returned
        ↓
Equipment becomes available again

Reservation Statuses

The system uses:

pending
approved
finalized
released
returned
rejected
cancelled

Meaning:

pending — waiting for Staff review

approved — online reservation approved

finalized — physical form and required signatures completed

released — equipment released to borrower

returned — equipment and School ID return completed

rejected — request rejected by Staff

cancelled — reservation cancelled

School ID Workflow

The School ID is handled separately from the reservation status.

Before release:

Physical Form Signed
        ↓
School ID Deposited
        ↓
Equipment Released

During return:

Equipment Returned
        ↓
School ID Returned
        ↓
Return Completed

The database stores:

id_deposited
id_deposited_at
id_returned
id_returned_at

Equipment Availability

The system prevents double-booking.

An equipment item is unavailable when the selected schedule overlaps an existing reservation with one of these statuses:

pending
approved
finalized
released

These statuses do not block future reservations:

returned
rejected
cancelled

Equipment marked as any of the following is also unavailable to borrowers:

damaged
maintenance
archived

Real-Time Updates

The system uses Socket.IO.

Examples:

New borrower requests appear automatically on the Staff side

Dashboard counts update automatically

Reservation Requests refresh automatically

Borrowed Items refresh automatically

Equipment changes appear automatically

Borrower tracking updates automatically

Availability can refresh without reloading the page

Technologies Used

Frontend

React

Vite

Tailwind CSS

Axios

React Router

Socket.IO Client

jsPDF

jsPDF AutoTable

XLSX

Backend

Node.js

Express

Socket.IO

JSON Web Token

MySQL2

dotenv

CORS

Database

MariaDB

MySQL compatible

Project Structure

equipment-reservation-system
│
├── client
│   ├── src
│   │   ├── components
│   │   │   ├── ModalPortal.jsx
│   │   │   ├── ProtectedStaff.jsx
│   │   │   └── StaffLayout.jsx
│   │   ├── pages
│   │   │   ├── borrower
│   │   │   │   ├── Borrow.jsx
│   │   │   │   └── Track.jsx
│   │   │   └── staff
│   │   │       ├── Login.jsx
│   │   │       ├── Dashboard.jsx
│   │   │       ├── Requests.jsx
│   │   │       ├── Borrowed.jsx
│   │   │       ├── Items.jsx
│   │   │       ├── Records.jsx
│   │   │       └── Settings.jsx
│   │   ├── services
│   │   │   ├── api.js
│   │   │   └── socket.js
│   │   ├── App.jsx
│   │   └── index.css
│   ├── .env
│   └── package.json
│
├── server
│   ├── config
│   │   └── database.js
│   ├── controllers
│   │   ├── authController.js
│   │   ├── itemController.js
│   │   ├── reservationController.js
│   │   └── staffController.js
│   ├── middleware
│   │   └── authMiddleware.js
│   ├── routes
│   │   ├── authRoutes.js
│   │   ├── itemRoutes.js
│   │   ├── reservationRoutes.js
│   │   └── staffRoutes.js
│   ├── .env
│   ├── server.js
│   └── package.json
│
├── database
│   └── schema.sql
│
├── .gitignore
└── README.md

System Requirements

The server computer should have:

Windows 10 or Windows 11

Node.js

npm

Git

MariaDB or MySQL

Chrome, Edge, or another modern browser

VS Code is not required to run the system. The project can be operated using Command Prompt or PowerShell.

GitHub Repository

https://github.com/Emils18/equipment-reservation-system.git

Installation Manual

1. Clone the Project

Open Command Prompt:

cd /D C:\
git clone https://github.com/Emils18/equipment-reservation-system.git
cd C:\equipment-reservation-system

2. Install Backend Dependencies

cd /D C:\equipment-reservation-system\server
npm install

3. Install Frontend Dependencies

cd /D C:\equipment-reservation-system\client
npm install

4. Create the Database

Using MySQL:

mysql -u root -e "CREATE DATABASE IF NOT EXISTS equipment_reservation;"

Using MariaDB:

mariadb -u root -e "CREATE DATABASE IF NOT EXISTS equipment_reservation;"

5. Import the Database Schema

Using MySQL:

mysql -u root equipment_reservation < C:\equipment-reservation-system\database\schema.sql

Using MariaDB:

mariadb -u root equipment_reservation < C:\equipment-reservation-system\database\schema.sql

6. Create the Backend Environment File

Create:

C:\equipment-reservation-system\server\.env

Contents:

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=equipment_reservation

PORT=5000
CLIENT_URL=http://localhost:5173

JWT_SECRET=YOUR_RANDOM_SECRET_HERE

Generate a JWT secret:

node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

Paste the generated value into JWT_SECRET.

Do not upload this secret to GitHub.

7. Create the Frontend Environment File

Create:

C:\equipment-reservation-system\client\.env

Contents:

VITE_API_URL=http://localhost:5000/api
VITE_SERVER_URL=http://localhost:5000

8. Create the First Staff Account

Public Staff registration is disabled.

Create the first account directly in MariaDB/MySQL:

USE equipment_reservation;

INSERT INTO staff (
    full_name,
    password
)
VALUES (
    'Staff Name',
    'Password123'
);

The database automatically creates the Staff account number.

Running the System

Use two Command Prompt windows.

Backend

cd /D C:\equipment-reservation-system\server
npm start

For development:

npm run dev

Backend:

http://localhost:5000

Database connection test:

http://localhost:5000/api/test-db

Frontend

In another Command Prompt:

cd /D C:\equipment-reservation-system\client
npm run dev

Open:

http://localhost:5173

System URLs

Client reservation page:

http://localhost:5173/borrow

Track reservation:

http://localhost:5173/track

Staff login:

http://localhost:5173/staff/login

Staff dashboard:

http://localhost:5173/staff/dashboard

Production Build Test

Before deployment:

cd /D C:\equipment-reservation-system\client
npm run build

A successful build creates:

client\dist

A Vite warning about large JavaScript chunks does not necessarily mean the build failed.

Local Network Setup

One computer acts as the main/server computer.

The server computer runs:

MariaDB/MySQL

Backend

Frontend

Other computers only need a web browser.

1. Find the Server PC IPv4 Address

ipconfig

Example:

192.168.1.100

2. Configure the Frontend

Edit:

client\.env

Example:

VITE_API_URL=http://192.168.1.100:5000/api
VITE_SERVER_URL=http://192.168.1.100:5000

Replace 192.168.1.100 with the actual server PC IPv4 address.

3. Configure the Backend

Edit:

server\.env

Example:

CLIENT_URL=http://192.168.1.100:5173

4. Start Frontend for LAN Access

cd /D C:\equipment-reservation-system\client
npm run dev -- --host 0.0.0.0

5. Start Backend

cd /D C:\equipment-reservation-system\server
npm start

6. Open from Another Computer

http://192.168.1.100:5173

Use the actual server PC IPv4 address.

If Windows Firewall asks for permission, allow Node.js on Private Networks.

Default ports:

Frontend: 5173
Backend: 5000

Updating the System Using GitHub

After the initial installation, normal code updates do not require a USB.

Development Computer

cd /D C:\equipment-reservation-system
git add .
git commit -m "Describe the update"
git push origin main

Server / School Computer

cd /D C:\equipment-reservation-system
git pull origin main

If dependencies changed:

cd /D C:\equipment-reservation-system\server
npm install

cd /D C:\equipment-reservation-system\client
npm install

Restart the backend and frontend afterward.

USB Transfer Manual

A USB drive can be used for the first installation or as an offline backup.

Example structure:

RepairRoom-System
│
├── equipment-reservation-system
└── equipment_reservation_backup.sql

The following examples assume the USB drive is E:. Change the drive letter if needed.

Prepare the USB on the Current PC

E:
mkdir RepairRoom-System 2>nul
cd /D E:\RepairRoom-System

if exist equipment-reservation-system rmdir /S /Q equipment-reservation-system

git clone https://github.com/Emils18/equipment-reservation-system.git

Back up the current database using MySQL:

mysqldump -u root equipment_reservation > E:\RepairRoom-System\equipment_reservation_backup.sql

Or MariaDB:

mariadb-dump -u root equipment_reservation > E:\RepairRoom-System\equipment_reservation_backup.sql

If the root account has a password:

mysqldump -u root -p equipment_reservation > E:\RepairRoom-System\equipment_reservation_backup.sql

Other PC Setup from USB

1. Copy the Project

xcopy E:\RepairRoom-System\equipment-reservation-system C:\equipment-reservation-system\ /E /I /H /Y

2. Install Packages

cd /D C:\equipment-reservation-system\server
npm install

cd /D C:\equipment-reservation-system\client
npm install

3. Create the Database

mysql -u root -e "CREATE DATABASE IF NOT EXISTS equipment_reservation;"

Or:

mariadb -u root -e "CREATE DATABASE IF NOT EXISTS equipment_reservation;"

4. Restore the Database Backup

Using MySQL:

mysql -u root equipment_reservation < E:\RepairRoom-System\equipment_reservation_backup.sql

Using MariaDB:

mariadb -u root equipment_reservation < E:\RepairRoom-System\equipment_reservation_backup.sql

5. Create server\.env and client\.env

Use the environment file examples in the Installation Manual above.

6. Start the System

Backend:

cd /D C:\equipment-reservation-system\server
npm start

Frontend:

cd /D C:\equipment-reservation-system\client
npm run dev

Then open:

http://localhost:5173

Database Backup and Restore

The source code and database are separate.

GitHub stores the source code. MariaDB/MySQL stores the actual operational data, including:

Staff accounts

Reservations

Equipment

Reservation history

School ID status

Borrowing records

Regular database backups are recommended.

Backup:

mysqldump -u root equipment_reservation > equipment_reservation_backup.sql

Restore:

mysql -u root equipment_reservation < equipment_reservation_backup.sql

Important Security Files

Never upload these to GitHub:

server/.env
client/.env
node_modules
client/dist

Recommended .gitignore:

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

Verify:

git check-ignore client/.env
git check-ignore server/.env
git ls-files client/.env server/.env

The final command should print nothing.

Troubleshooting

npm is not recognized

Install Node.js and reopen Command Prompt.

node -v
npm -v

git is not recognized

Install Git.

git --version

mysql or mariadb is not recognized

Make sure MariaDB/MySQL is installed and its bin directory is included in the Windows PATH.

Database Connection Failed

Check:

server/.env

Verify:

DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME

Also make sure MariaDB/MySQL is running.

Client Cannot Connect to Backend

Check:

client/.env

For same-PC use:

VITE_API_URL=http://localhost:5000/api
VITE_SERVER_URL=http://localhost:5000

Also verify that the backend is running.

Reservation Page Opens but Equipment Does Not Load

Check:

http://localhost:5000/api/reservations/catalog

Also verify:

Database is running

Backend is running

Equipment records exist

Equipment is active

Another Computer Cannot Access the System

Check:

Both computers are on the same network

Correct server IPv4 address is being used

Frontend was started with --host 0.0.0.0

Backend is running

Windows Firewall allows Node.js

Ports 5173 and 5000 are reachable

Latest GitHub Update Is Not Showing

cd /D C:\equipment-reservation-system
git pull origin main

Restart the frontend/backend and refresh the browser with:

Ctrl + F5

Useful Git Commands

Check changes:

git status

Download updates:

git pull origin main

Stage changes:

git add .

Commit:

git commit -m "Update system"

Push:

git push origin main

Main Features

✓ Borrower equipment reservation
✓ Live equipment availability
✓ Reservation conflict prevention
✓ Draft form persistence
✓ Reservation tracking
✓ Real-time updates
✓ Staff login
✓ Staff dashboard
✓ Reservation approval/rejection
✓ Physical form confirmation
✓ School ID deposit confirmation
✓ Equipment release
✓ Borrowed item monitoring
✓ Equipment return workflow
✓ School ID return workflow
✓ Equipment inventory
✓ Equipment search
✓ Equipment category filtering
✓ Equipment archive/restore
✓ Reservation records
✓ Excel/PDF exports
✓ Staff account settings
✓ Responsive design
✓ Local network support
✓ GitHub update workflow

Credits

Developed as an academic system project by:

Emelio Mondares
BSIT – 4th Year

Project Repository

https://github.com/Emils18/equipment-reservation-system

Repair Room Equipment Reservation System
Repair Room – CMOB Department
