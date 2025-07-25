const authService = require("../services/authService");
const { successCreate, error, unauthorized } = require("../utils/response");

// ✅ Import fungsi untuk blacklist token
const { addTokenToBlacklist } = require("../../middlewares/authMiddleware");

/**
 * Login Controller
 * Body: { username, password }
 */
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await authService.login(username, password);
    return successCreate(res, "Login successful", result);
  } catch (err) {
    if (
      err.message === "User not found or inactive" ||
      err.message === "Incorrect password"
    ) {
      return unauthorized(res, err.message);
    }

    return error(res, err.message);
  }
};

/**
 * Logout Controller
 * Header: Authorization: Bearer <token>
 */
exports.logout = (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return unauthorized(res, "Token not provided");
  }

  // ✅ Tambahkan token ke blacklist
  addTokenToBlacklist(token);

  return res.status(200).json({
    status: true,
    code: 200,
    message: "Logout successful. Token has been invalidated.",
  });
};
