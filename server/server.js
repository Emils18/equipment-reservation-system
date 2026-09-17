// =====================================================
// Equipment Reservation System
// Main Backend Server
// =====================================================

const express = require("express");
const cors = require("cors");
const http = require("http");

const {
  Server,
} = require("socket.io");

require("dotenv").config();

const database = require(
  "./config/database"
);

const itemRoutes = require(
  "./routes/itemRoutes"
);

const authRoutes = require(
  "./routes/authRoutes"
);

const staffRoutes = require(
  "./routes/staffRoutes"
);


// =====================================================
// Create Server
// =====================================================

const app = express();

const httpServer =
  http.createServer(app);


// =====================================================
// Real-Time Socket Server
// =====================================================

const io = new Server(
  httpServer,
  {
    cors: {
      origin:
        process.env.CLIENT_URL ||
        "http://localhost:5173",

      credentials: true,
    },
  }
);

// Allows controllers to use Socket.IO
app.set("io", io);


// =====================================================
// Middleware
// =====================================================

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",

    credentials: true,
  })
);

app.use(express.json());


// =====================================================
// API Routes
// =====================================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/staff",
  staffRoutes
);

app.use(
  "/api/items",
  itemRoutes
);


// =====================================================
// Server Test
// =====================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message:
      "Equipment Reservation System API is running.",
  });
});


// =====================================================
// Database Test
// =====================================================

app.get(
  "/api/test-db",
  async (req, res) => {
    try {
      const [rows] =
        await database.query(
          "SELECT DATABASE() AS database_name"
        );

      res.json({
        success: true,
        message:
          "Database connected successfully.",
        database:
          rows[0].database_name,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          "Database connection failed.",
        error: error.message,
      });
    }
  }
);


// =====================================================
// Real-Time Connections
// =====================================================

io.on(
  "connection",
  (socket) => {
    console.log(
      "Browser connected:",
      socket.id
    );

    socket.on(
      "disconnect",
      () => {
        console.log(
          "Browser disconnected:",
          socket.id
        );
      }
    );
  }
);


// =====================================================
// Start Server
// =====================================================

const PORT =
  process.env.PORT || 5000;

httpServer.listen(
  PORT,
  () => {
    console.log("");
    console.log(
      "=========================================="
    );

    console.log(
      " Equipment Reservation System"
    );

    console.log(
      "=========================================="
    );

    console.log(
      ` Server: http://localhost:${PORT}`
    );

    console.log(
      ` DB Test: http://localhost:${PORT}/api/test-db`
    );

    console.log(
      " Real-time updates: ON"
    );

    console.log(
      "=========================================="
    );

    console.log("");
  }
);