const minioClient = require("../../config/minioClient"); // ✅ benar

async function deleteFile(objectPath) {
  try {
    await minioClient.removeObject("document", objectPath);
    console.log(`✅ Deleted old file: ${objectPath}`);
  } catch (error) {
    console.error("❌ Failed to delete file from MinIO:", error);
  }
}

module.exports = {
  deleteFile,
};
