const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const minioClient = require("../config/minioClient");
const { minio } = require("../config/dotenv");

const storage = multer.memoryStorage();
const upload = multer({ storage });

const allowedMimeTypes = [
  "application/msword", // .doc
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
];

const allowedMediaTypes = [
  "audio/mpeg",     // .mp3
  "audio/wav",      // .wav
  "audio/x-m4a",    // .m4a (variasi umum)
  "audio/mp4",      // .m4a juga kadang ini
  "video/mp4",      // .mp4
  "video/mpeg",     // .mpeg
];

const uploadToMinio = (fieldName) => {
  return [
    upload.single(fieldName),
    async (req, res, next) => {
      try {
        if (!req.file && req.method === "POST") {
          return res.status(400).json({ message: "No file uploaded" });
        }

        if (!req.file) return next();

        // 🔒 Validasi tipe file dokumen
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
          return res.status(400).json({
            message: "Invalid file type. Only Word documents are allowed.",
          });
        }

        const extension = path.extname(req.file.originalname);
        const filename = `${uuidv4()}${extension}`;

        await minioClient.putObject(
          minio.bucketDocument,
          filename,
          req.file.buffer,
          req.file.size,
          {
            "Content-Type": req.file.mimetype,
          }
        );

        req.minioFilename = filename;
        req.originalFileName = req.file.originalname;

        next();
      } catch (err) {
        console.error("Upload to MinIO failed:", err);
        return res
          .status(500)
          .json({ message: "Failed to upload file to storage" });
      }
    },
  ];
};

// 🎵 Upload audio/video (pakai original name sebagai filename di MinIO)
const uploadMediaToMinio = (fieldName, subfolder = "") => {
  return [
    upload.single(fieldName),
    async (req, res, next) => {
      try {
        if (!req.file && req.method === "POST") {
          return res.status(400).json({ message: "No media file uploaded" });
        }

        if (!req.file) return next();

        if (!allowedMediaTypes.includes(req.file.mimetype)) {
          return res
            .status(400)
            .json({ message: "Invalid media type. Only audio/video allowed." });
        }

        const filename = req.file.originalname;
        const objectName = subfolder ? `${subfolder}/${filename}` : filename;

        // 👉 Ubah bucket ke "report"
        await minioClient.putObject(
          minio.bucketReport, // <- pakai bucket baru
          objectName,
          req.file.buffer,
          req.file.size,
          {
            "Content-Type": req.file.mimetype,
          }
        );

        req.minioFilename = objectName;
        req.originalFileName = filename;

        next();
      } catch (err) {
        console.error("Upload media to MinIO failed:", err);
        return res
          .status(500)
          .json({ message: "Failed to upload media file to storage" });
      }
    },
  ];
};


module.exports = {
  uploadToMinio,
  uploadMediaToMinio,
};
