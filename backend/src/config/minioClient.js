const { Client } = require("minio");
const { minio } = require("./dotenv");

const minioClient = new Client({
  endPoint: minio.endPoint,
  port: minio.port,
  useSSL: minio.useSSL,
  accessKey: minio.accessKey,
  secretKey: minio.secretKey,
});

module.exports = minioClient;
