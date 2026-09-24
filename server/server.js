// =====================================================
// Equipment Reservation System
// Main Backend Server
// =====================================================

const express =
  require("express");

const cors =
  require("cors");

const http =
  require("http");

const {
  Server,
} = require("socket.io");


require("dotenv").config();


const database = require(
  "./config/database"
);


// =====================================================
// Routes
// =====================================================

const itemRoutes = require(
  "./routes/itemRoutes"
);

const authRoutes = require(
  "./routes/authRoutes"
);

const staffRoutes = require(
  "./routes/staffRoutes"
);

const reservationRoutes = require(
  "./routes/reservationRoutes"
);


// =====================================================
// Create Express + HTTP Server
// =====================================================

const app =
  express();

const httpServer =
  http.createServer(app);


// =====================================================
// Real-Time Socket Server
// =====================================================

const io =
  new Server(
    httpServer,
    {
      cors: {
          origin: [
            process.env.CLIENT_URL,
            "http://localhost:5173",
          ].filter(Boolean),

          credentials: true,
        },
    }
  );


// Makes Socket.IO available inside controllers
app.set("io", io);


// =====================================================
// Middleware
// =====================================================

app.use(
  cors({
    origin: function (origin, callback) {

      const allowedOrigins = [
        process.env.CLIENT_URL,
        "http://localhost:5173",
        "https://equipment-reservation-system-p4x8kt02c.vercel.app",
        "https://equipment-reserve.vercel.app"
      ];

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }

    },
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization"
    ]
  })
);


app.use(
  express.json()
);





// =====================================================
// API Routes
// =====================================================

// Staff authentication
app.use(
  "/api/auth",
  authRoutes
);


// Staff/Admin Panel
app.use(
  "/api/staff",
  staffRoutes
);


// Equipment management
app.use(
  "/api/items",
  itemRoutes
);


// Public borrower reservations
app.use(
  "/api/reservations",
  reservationRoutes
);


// =====================================================
// Server Test
// =====================================================

app.get(
  "/",
  (req, res) => {
    res.json({
      success: true,

      message:
        "Equipment Reservation System API is running.",
    });
  }
);


// =====================================================
// Database Test
// =====================================================

app.get(
  "/api/test-db",

  async (req, res) => {
    try {
      const [rows] =
        await database.query(
          `
          SELECT
            DATABASE() AS database_name
          `
        );


      res.json({
        success: true,

        message:
          "Database connected successfully.",

        database:
          rows[0].database_name,
      });
    } catch (error) {
      console.error(
        "Database connection error:",
        error.message
      );


      res.status(500).json({
        success: false,

        message:
          "Database connection failed.",

        error:
          error.message,
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
  process.env.PORT ||
  5000;


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
      ` Borrower API: http://localhost:${PORT}/api/reservations/catalog`
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