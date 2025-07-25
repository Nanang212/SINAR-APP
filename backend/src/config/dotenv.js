const dotenv = require("dotenv");

dotenv.config();

// const baseUrl = "http://localhost:3000";

const baseUrl =
  process.env.NODE_ENV === "development"
    ? process.env.APP_BASE_URL_DEV
    : process.env.APP_BASE_URL_PROD;

module.exports = {
  // App
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",

  // Database
  databaseUrl: process.env.DATABASE_URL,

  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",

  // MinIO
  minio: {
    endPoint: process.env.MINIO_ENDPOINT || "localhost",
    port: parseInt(process.env.MINIO_PORT) || 9000,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
    bucketDocument: process.env.MINIO_BUCKET_DOCUMENT || "document",
    bucketReport: process.env.MINIO_BUCKET_REPORT || "report",
    useSSL: process.env.MINIO_USE_SSL === "true", // convert string to boolean
  },
  baseUrl,
};
