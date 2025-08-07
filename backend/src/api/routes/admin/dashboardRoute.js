const express = require("express");
const router = express.Router();
const dashboardController = require("../../controllers/dashboardController");
const { verifyToken } = require("../../../middlewares/authMiddleware");
const roleMiddleware = require("../../../middlewares/roleMiddleware");

// Dashboard routes - hanya untuk admin
router.get(
  "/stats/documents", 
  verifyToken, 
  roleMiddleware(["admin"]), 
  dashboardController.getDocumentStatsByMonth
);

router.get(
  "/stats/reports", 
  verifyToken, 
  roleMiddleware(["admin"]), 
  dashboardController.getReportStatsByMonth
);

router.get(
  "/stats/users", 
  verifyToken, 
  roleMiddleware(["admin"]), 
  dashboardController.getUserStats
);

router.get(
  "/overview", 
  verifyToken, 
  roleMiddleware(["admin"]), 
  dashboardController.getDashboardOverview
);

module.exports = router;