const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");

const rateLimiter = require("../config/rateLimit");
const routes = require("./routes");
const { port, nodeEnv } = require("../config/dotenv");

const app = express();

// Middleware umum
app.use(rateLimiter);
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('trust proxy', false);
// Routes
app.use("/api", routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: false,
    code: 404,
    message: "Route not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("💥 Internal Server Error:", err);
  res.status(500).json({
    status: false,
    code: 500,
    message: "Internal server error",
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running in ${nodeEnv} mode on http://localhost:${port}`);
});
