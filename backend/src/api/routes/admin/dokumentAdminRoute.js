const express = require("express");
const router = express.Router();

const documentController = require("../../controllers/dokumentController");
const { verifyToken } = require("../../../middlewares/authMiddleware");
const roleMiddleware = require("../../../middlewares/roleMiddleware");
const { uploadToMinio } = require("../../../middlewares/uploadMiddleware");

// 📁 Upload document (admin only)
router.post(
  "/upload",
  verifyToken,
  roleMiddleware(["admin"]),
  ...uploadToMinio("file"),
  documentController.uploadDocument
);

// ✏️ Update document (admin only, with optional file)
router.put(
  "/:id",
  verifyToken,
  roleMiddleware(["admin"]),
  ...uploadToMinio("file"), // Tambahkan middleware upload dokumen
  documentController.updateDocument
);

// ❌ Soft delete document (admin only)
router.delete(
  "/:id",
  verifyToken,
  roleMiddleware(["admin"]),
  documentController.deleteDocument
);

module.exports = router;
