// =====================================================
// Staff Authentication Middleware
// =====================================================

const jwt = require("jsonwebtoken");
const database = require("../config/database");


// =====================================================
// Read Cookie
// =====================================================

const getCookie = (
  req,
  cookieName
) => {
  const header =
    req.headers.cookie || "";

  const cookies =
    header.split(";");

  for (const cookie of cookies) {
    const trimmed =
      cookie.trim();

    const separator =
      trimmed.indexOf("=");

    if (separator === -1) {
      continue;
    }

    const name =
      trimmed.slice(
        0,
        separator
      );

    const value =
      trimmed.slice(
        separator + 1
      );

    if (name === cookieName) {
      return decodeURIComponent(
        value
      );
    }
  }

  return null;
};


// =====================================================
// Require Staff Login
// =====================================================

const requireStaff = async (
  req,
  res,
  next
) => {
  try {
    const token =
      getCookie(
        req,
        "staff_session"
      );

    if (!token) {
      return res.status(401).json({
        success: false,
        message:
          "Staff login required.",
      });
    }

    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    const [rows] =
      await database.query(
        `
        SELECT
          id,
          full_name,
          is_active,
          created_at
        FROM staff
        WHERE id = ?
          AND is_active = TRUE
        LIMIT 1
        `,
        [
          decoded.staff_id,
        ]
      );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message:
          "Staff account is unavailable.",
      });
    }

    req.staff =
      rows[0];

    next();
  } catch {
    return res.status(401).json({
      success: false,
      message:
        "Staff session is invalid.",
    });
  }
};


module.exports = {
  requireStaff,
};