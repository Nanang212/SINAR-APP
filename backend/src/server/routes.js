const express = require("express");
const router = express.Router();

//auth
const authRoutes = require("../api/routes/auth/authRoutes");

//auth
router.use("/v1/auth", authRoutes);

//admin
const dokumentAdminRoutes = require("../api/routes/admin/dokumentAdminRoute");
const userAdminRoutes = require("../api/routes/admin/userAdminRoutes");
const kategoriAdminRoutes = require("../api/routes/admin/kategoriAdminRoute");
const dokumentReportAdminRoutes = require("../api/routes/admin/dokumentReportAdminRoute");
const seedRoutes = require("../api/routes/admin/seedRoute");
const dashboardRoutes = require("../api/routes/admin/dashboardRoute");

//admin
router.use("/v1/admin/documents", dokumentAdminRoutes);
router.use("/v1/admin/users", userAdminRoutes);
router.use("/v1/admin/categories", kategoriAdminRoutes);
router.use("/v1/admin/reports", dokumentReportAdminRoutes);
router.use("/v1/admin/seed", seedRoutes);
router.use("/v1/admin/dashboard", dashboardRoutes);

//user
const documentRoutes = require("../api/routes/user/documentRoute");
const userRoutes = require("../api/routes/user/userRoute");
const kategoriRoutes = require("../api/routes/user/kategoriRoute");

//user
router.use("/v1/documents", documentRoutes);
router.use("/v1/users", userRoutes);
router.use("/v1/categories", kategoriRoutes);

module.exports = router;