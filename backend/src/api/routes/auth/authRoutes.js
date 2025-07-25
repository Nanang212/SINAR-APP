const express = require("express");
const router = express.Router();
const authController = require("../../controllers/authController");
const { verifyToken } = require("../../../middlewares/authMiddleware");
const { body } = require("express-validator");

// ====== LOGIN ======
router.post(
  "/login",
  [
    body("username").notEmpty().withMessage("Username wajib diisi"),
    body("password").notEmpty().withMessage("Password wajib diisi"),
  ],
  authController.login
);

// ====== LOGOUT ======
router.post("/logout", verifyToken, authController.logout);

module.exports = router;
