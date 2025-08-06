const express = require("express");
const router = express.Router();
const seedController = require("../../controllers/seedController");
const { verifyToken } = require("../../../middlewares/authMiddleware");
const roleMiddleware = require("../../../middlewares/roleMiddleware");

router.post(
  "/truncate-and-seed",
  verifyToken,
  roleMiddleware(["admin"]),
  seedController.truncateAndSeed
);

module.exports = router;
