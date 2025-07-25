const express = require("express");
const router = express.Router();

const kategoriController = require("../../controllers/kategoriController");
const { verifyToken } = require("../../../middlewares/authMiddleware");

// URUTAN TEPAT agar tidak bentrok
router.get("/", verifyToken, kategoriController.getAllKategori);
router.get("/:id", verifyToken, kategoriController.getKategoriById);

module.exports = router;