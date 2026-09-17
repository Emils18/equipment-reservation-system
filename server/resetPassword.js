// =====================================================
// Staff Password Recovery
// Run this from the office/server PC if staff forgets
// the password.
// =====================================================

const database = require("./config/database");

async function resetPassword() {
  const username = process.argv[2];
  const newPassword = process.argv[3];

  if (!username || !newPassword) {
    console.log("");
    console.log("Usage:");
    console.log(
      "npm run reset-password -- USERNAME NEW_PASSWORD"
    );
    console.log("");

    process.exit(1);
  }

  if (newPassword.length < 6) {
    console.log(
      "Password must contain at least 6 characters."
    );

    process.exit(1);
  }

  try {
    const [staff] =
      await database.query(
        `
        SELECT id, username
        FROM staff
        WHERE username = ?
        LIMIT 1
        `,
        [username]
      );

    if (staff.length === 0) {
      console.log(
        `Staff account "${username}" was not found.`
      );

      process.exit(1);
    }

    // Store the new password directly
    await database.query(
      `
      UPDATE staff
      SET password = ?
      WHERE id = ?
      `,
      [
        newPassword,
        staff[0].id,
      ]
    );

    console.log("");
    console.log(
      `Password reset successfully for ${username}.`
    );
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error(
      "Password reset failed:",
      error.message
    );

    process.exit(1);
  }
}

resetPassword();