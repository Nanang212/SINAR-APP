const express = require("express");
const router = express.Router();

const documentReportController = require("../../controllers/dokumentReportController");
const { verifyToken } = require("../../../middlewares/authMiddleware");
const { uploadMediaToMinio } = require("../../../middlewares/uploadMiddleware");

router.get("/", verifyToken, documentReportController.getAllReports);

router.get("/:id", verifyToken, documentReportController.getReportById);

router.post(
  "/",
  verifyToken,
  uploadMediaToMinio(["audio", "video"], "report"),
  documentReportController.createReport
);

router.put(
  "/:id",
  verifyToken,
  uploadMediaToMinio(["audio", "video"], "report"),
  documentReportController.updateReport
);

router.delete("/:id", verifyToken, documentReportController.deleteReport);

router.get("/download/:id", verifyToken, documentReportController.downloadReportMedia);
router.get("/preview/:id", verifyToken, documentReportController.previewReportMedia);

module.exports = router;
