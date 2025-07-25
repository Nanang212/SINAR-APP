const express = require("express");
const router = express.Router();

const documentController = require("../../controllers/dokumentController");
const { verifyToken } = require("../../../middlewares/authMiddleware");

// URUTAN TEPAT agar tidak bentrok
router.get("/download/:id", verifyToken, documentController.downloadDocument);
router.get("/", verifyToken, documentController.getAllDocuments);
router.get("/:id", verifyToken, documentController.getDocumentById);


module.exports = router;
