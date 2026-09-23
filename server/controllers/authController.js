// =====================================================
// Staff Authentication Controller
// Login/Register uses Name + Password only
//
// Account number is automatically created by database ID.
// =====================================================

const jwt = require("jsonwebtoken");
const database = require("../config/database");

const COOKIE_NAME = "staff_session";

const COOKIE_AGE =
  1000 * 60 * 60 * 24 * 365;

const cookieOptions = {
  httpOnly: true,

  sameSite: "none",

  secure: true,

  maxAge: COOKIE_AGE,
};


// =====================================================
// SETUP STATUS
// =====================================================

const setupStatus = async (req, res) => {
  try {
    const [rows] =
      await database.query(`
        SELECT COUNT(*) AS total
        FROM staff
      `);

    res.json({
      success: true,
      total_staff:
        Number(rows[0].total),
    });
  } catch (error) {
    console.error(
      "Setup status error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Could not check staff accounts.",
    });
  }
};


// =====================================================
// REGISTER STAFF
// Name + Password only
// =====================================================

const register = async (req, res) => {
  try {
    const {
      full_name,
      password,
    } = req.body;

    if (
      !full_name ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name and password are required.",
      });
    }

    if (password.length < 4) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 4 characters.",
      });
    }

    const [result] =
      await database.query(
        `
        INSERT INTO staff
        (
          full_name,
          password
        )
        VALUES (?, ?)
        `,
        [
          full_name.trim(),
          password,
        ]
      );

    res.status(201).json({
      success: true,

      message:
        "Staff account created successfully.",

      account_number:
        result.insertId,
    });
  } catch (error) {
    console.error(
      "Register error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Could not create staff account.",
    });
  }
};


// =====================================================
// LOGIN
// Name + Password
// =====================================================

const login = async (req, res) => {
  try {
    const {
      full_name,
      password,
    } = req.body;

    if (
      !full_name ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name and password are required.",
      });
    }

    const [rows] =
      await database.query(
        `
        SELECT *
        FROM staff
        WHERE full_name = ?
          AND password = ?
          AND is_active = TRUE
        LIMIT 1
        `,
        [
          full_name.trim(),
          password,
        ]
      );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message:
          "Incorrect name or password.",
      });
    }

    const staff = rows[0];

    const token = jwt.sign(
      {
        staff_id: staff.id,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "365d",
      }
    );

    res.cookie(
      COOKIE_NAME,
      token,
      cookieOptions
    );

    res.json({
      success: true,

      message:
        "Logged in successfully.",

      staff: {
        id: staff.id,
        full_name:
          staff.full_name,
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Could not log in.",
    });
  }
};


// =====================================================
// CURRENT STAFF
// =====================================================

const me = async (req, res) => {
  res.json({
    success: true,
    staff: req.staff,
  });
};


// =====================================================
// LOGOUT
// =====================================================

const logout = async (req, res) => {
  res.clearCookie(
    COOKIE_NAME,
    {
      httpOnly: true,
      sameSite: "lax",

      secure:
        process.env.NODE_ENV ===
        "production",
    }
  );

  res.json({
    success: true,
    message:
      "Logged out successfully.",
  });
};


// =====================================================
// UPDATE NAME
// =====================================================

const updateProfile = async (
  req,
  res
) => {
  try {
    const { full_name } =
      req.body;

    if (!full_name) {
      return res.status(400).json({
        success: false,
        message:
          "Staff name is required.",
      });
    }

    await database.query(
      `
      UPDATE staff
      SET full_name = ?
      WHERE id = ?
      `,
      [
        full_name.trim(),
        req.staff.id,
      ]
    );

    res.json({
      success: true,
      message:
        "Staff information updated.",
    });
  } catch (error) {
    console.error(
      "Profile update error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Could not update account.",
    });
  }
};


// =====================================================
// CHANGE PASSWORD
// =====================================================

const changePassword = async (
  req,
  res
) => {
  try {
    const {
      current_password,
      new_password,
    } = req.body;

    if (
      !current_password ||
      !new_password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Current and new password are required.",
      });
    }

    const [rows] =
      await database.query(
        `
        SELECT password
        FROM staff
        WHERE id = ?
        LIMIT 1
        `,
        [req.staff.id]
      );

    if (
      rows.length === 0 ||
      rows[0].password !==
        current_password
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Current password is incorrect.",
      });
    }

    await database.query(
      `
      UPDATE staff
      SET password = ?
      WHERE id = ?
      `,
      [
        new_password,
        req.staff.id,
      ]
    );

    res.json({
      success: true,
      message:
        "Password changed successfully.",
    });
  } catch (error) {
    console.error(
      "Password change error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        "Could not change password.",
    });
  }
};


module.exports = {
  setupStatus,
  register,
  login,
  me,
  logout,
  updateProfile,
  changePassword,
};