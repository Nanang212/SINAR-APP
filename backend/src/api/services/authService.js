const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { jwtSecret, jwtExpiresIn } = require("../../config/dotenv");

/**
 * Login handler.
 * @param {string} username 
 * @param {string} password 
 * @returns {Object} JWT token + user data
 */
exports.login = async (username, password) => {
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      role: true,
      category: true,
    },
  });

  if (!user || !user.is_active) {
    throw new Error("User not found or inactive");
  }

  const passwordValid = await bcrypt.compare(password, user.password);
  if (!passwordValid) {
    throw new Error("Incorrect password");
  }

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role.name,
      category_id: user.category_id,
    },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role.name,
      category: user.category?.name || null,
    },
  };
};

/**
 * Logout handler (optional - template only).
 * @param {number} userId 
 * @param {string} token 
 * @returns {boolean}
 */
exports.logout = async (userId, token) => {
  // Jika nanti ingin blacklist token, bisa simpan token di DB di sini
  console.log(`User ${userId} logged out with token: ${token}`);
  return true;
};
