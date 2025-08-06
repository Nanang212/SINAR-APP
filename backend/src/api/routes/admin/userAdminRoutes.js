const express = require("express");
const router = express.Router();

const userController = require("../../controllers/userController");
const { verifyToken } = require("../../../middlewares/authMiddleware");
const roleMiddleware = require("../../../middlewares/roleMiddleware");
const { uploadLogoToMinio } = require("../../../middlewares/uploadMiddleware");

// // GET Routes
// router.get(
//   "/",
//   verifyToken,
//   roleMiddleware(["admin"]),
//   userController.getAllUsers
// );

// router.get(
//   "/:id",
//   verifyToken,
//   roleMiddleware(["admin"]),
//   userController.getUserById
// );

router.get(
  "/preview/:id",
  verifyToken,
  roleMiddleware(["admin"]),
  userController.previewUserLogo
);

// POST Routes
router.post(
  "/",
  verifyToken,
  roleMiddleware(["admin"]),
  ...uploadLogoToMinio("logo"),
  userController.createUser
);

router.put(
  "/:id",
  verifyToken,
  roleMiddleware(["admin"]),
  ...uploadLogoToMinio("logo"),
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
