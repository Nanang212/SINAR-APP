const express = require("express");
const router = express.Router();

const userController = require("../../controllers/userController");
const { verifyToken } = require("../../../middlewares/authMiddleware");
const roleMiddleware = require("../../../middlewares/roleMiddleware");

router.post(
  "/",
  verifyToken,
  roleMiddleware(["admin"]),
  userController.createUser
);

router.put(
  "/:id",
  verifyToken,
  roleMiddleware(["admin"]),
  userController.updateUser
);

router.delete(
  "/:id",
  verifyToken,
  roleMiddleware(["admin"]),
  userController.deleteUser
);

router.put(
  "/:id/reset-password",
  verifyToken,
  roleMiddleware(["admin"]),
  userController.resetPasswordByAdmin
);

module.exports = router;
