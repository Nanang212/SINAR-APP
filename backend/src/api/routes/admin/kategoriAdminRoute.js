const express = require("express");
const router = express.Router();

const kategoriController = require("../../controllers/kategoriController");
const { verifyToken } = require("../../../middlewares/authMiddleware");
const roleMiddleware = require("../../../middlewares/roleMiddleware");

router.post(
  "/",
  verifyToken,
  roleMiddleware(["admin"]),
  kategoriController.createKategori
);
router.put(
  "/:id",
  verifyToken,
  roleMiddleware(["admin"]),
  kategoriController.updateKategori
);
router.delete(
  "/:id",
  verifyToken,
  roleMiddleware(["admin"]),
  kategoriController.deleteKategori
);

module.exports = router;
