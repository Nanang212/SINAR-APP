const minioClient = require("../../config/minioClient");
const { minio } = require("../../config/dotenv");
const path = require("path");
const mime = require("mime-types");
const mammoth = require("mammoth"); // ✅ Tambahan untuk konversi DOCX ke HTML

/**
 * Delete file from 'document' bucket
 */
async function deleteFile(objectPath) {
  try {
    await minioClient.removeObject(minio.bucketDocument, objectPath);
    console.log(`✅ File deleted: ${objectPath}`);
  } catch (error) {
    console.error("❌ Failed to delete file from MinIO:", error);
  }
}

async function deleteReportMedia(filePath) {
  try {
    if (!filePath) {
      console.warn("⚠️ No file path provided to delete");
      return;
    }

    await minioClient.removeObject(minio.bucketReport, filePath);
    console.log(`✅ Report media deleted from MinIO: ${filePath}`);
  } catch (error) {
    console.error("❌ Failed to delete report media from MinIO:", error);
  }
}

/**
 * Stream document file from 'document' bucket (DOC, PDF, etc.)
 */
const streamDocument = async (objectName, req, res) => {
  try {
    const bucket = minio.bucketDocument;
    const ext = path.extname(objectName).toLowerCase();

    if (ext === ".docx") {
      // ✅ Ambil file dari MinIO sebagai buffer
      const chunks = [];
      const fileStream = await minioClient.getObject(bucket, objectName);

      fileStream.on("data", (chunk) => chunks.push(chunk));
      fileStream.on("end", async () => {
        const buffer = Buffer.concat(chunks);

        try {
          const { value: html } = await mammoth.convertToHtml({ buffer });

          res.setHeader("Content-Type", "text/html");
          res.setHeader(
            "Content-Disposition",
            `inline; filename="${objectName}.html"`
          );
          return res.send(html);
        } catch (convertErr) {
          console.error("❌ Failed to convert DOCX to HTML:", convertErr);
          return res.status(500).json({
            status: false,
            message: "Failed to convert DOCX to HTML",
          });
        }
      });

      fileStream.on("error", (err) => {
        console.error("❌ Failed to read DOCX from MinIO:", err);
        return res.status(500).json({
          status: false,
          message: "Failed to read file from MinIO",
        });
      });
    } else {
      // ✅ Untuk file selain DOCX (misalnya PDF), stream biasa
      const stat = await minioClient.statObject(bucket, objectName);
      const fileSize = stat.size;

      const mimeType = mime.lookup(objectName) || "application/octet-stream";

      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": mimeType,
        "Content-Disposition": `inline; filename="${objectName}"`,
      });

      const stream = await minioClient.getObject(bucket, objectName);
      stream.pipe(res);
    }
  } catch (error) {
    console.error("❌ Failed to stream document:", error);
    res.status(500).json({
      status: false,
      message: "Failed to preview document",
    });
  }
};
/**
 * Stream video/audio file from 'report' bucket with Range support
 */
const streamMedia = async (objectName, req, res) => {
  try {
    const bucket = minio.bucketReport;
    const stat = await minioClient.statObject(bucket, objectName);
    const fileSize = stat.size;

    const ext = path.extname(objectName).toLowerCase();
    const isVideo = ext === ".mp4" || ext === ".mov" || ext === ".mkv";
    const isAudio = ext === ".mp3" || ext === ".m4a" || ext === ".aac";

    const mimeType = isVideo
      ? "video/mp4" // ✅ pakai fix type
      : isAudio
        ? mime.lookup(ext) || "audio/mpeg" // ✅ pakai dari mime-types
        : mime.lookup(ext) || "application/octet-stream";

    const range = req.headers.range;

    if (range) {
      const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
      const start = parseInt(startStr, 10);
      const end = endStr ? parseInt(endStr, 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.status(416).send("Requested range not satisfiable");
        return;
      }

      const contentLength = end - start + 1;
      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": mimeType,
      });

      const stream = await minioClient.getPartialObject(
        bucket,
        objectName,
        start,
        contentLength
      );
      stream.pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": mimeType,
      });

      const stream = await minioClient.getObject(bucket, objectName);
      stream.pipe(res);
    }
  } catch (error) {
    console.error("❌ Failed to stream media:", error);
    res.status(500).json({
      status: false,
      message: "Failed to preview media",
    });
  }
};

/**
 * Stream user logo file from 'document' bucket (images)
 */
const streamUserLogo = async (objectName, req, res) => {
  try {
    const bucket = minio.bucketDocument; // User logos are stored in document bucket
    const ext = path.extname(objectName).toLowerCase();
    const mimeType = mime.lookup(objectName) || "application/octet-stream";

    // Check if it's an image file
    if (!['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'].includes(ext)) {
      return res.status(400).json({
        status: false,
        message: "File is not a valid image format",
      });
    }

    // Set appropriate headers for image preview
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${objectName}"`);
    res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour

    const stream = await minioClient.getObject(bucket, objectName);
    stream.pipe(res);

  } catch (error) {
    console.error("❌ Failed to stream user logo:", error);
    res.status(500).json({
      status: false,
      message: "Failed to preview user logo",
    });
  }
};

module.exports = {
  deleteFile,
  streamDocument,
  streamMedia,
  streamUserLogo,
  deleteReportMedia,
};
