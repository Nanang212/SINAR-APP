const express = require("express");
const router = express.Router();

const userController = require("../../controllers/userController");
const { verifyToken } = require("../../../middlewares/authMiddleware");

// URUTAN TEPAT agar tidak bentrok
router.get("/", verifyToken, userController.getAllUsers);
router.put(
  "/change-password",
  verifyToken,
  userController.changePasswordByUser
);
router.get("/:id", verifyToken, userController.getUserById);

module.exports = router;
