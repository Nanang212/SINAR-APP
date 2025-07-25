const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/dotenv");

// 🔒 In-memory blacklist
const tokenBlacklist = new Set();

exports.addTokenToBlacklist = (token) => {
  tokenBlacklist.add(token);
};

exports.verifyToken = (req, res, next) => {
  // 🔍 Ambil token dari header atau query
  const token =
    req.headers.authorization?.split(" ")[1] || req.query.token;

  if (!token) {
    return res.status(401).json({ message: "Token required" });
  }

  // ❌ Cek apakah token di-blacklist
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ message: "Token has been logged out" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
