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
  "audio/mpeg", // .mp3
  "audio/wav", // .wav
  "audio/x-m4a", // .m4a (variasi umum)
  "audio/mp4", // .m4a juga kadang ini
  "video/mp4", // .mp4
  "video/mpeg", // .mpeg
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
const uploadMediaToMinio = (
  fields = ["video", "audio"],
  subfolder = "report"
) => {
  const multerFields = fields.map((field) => ({ name: field, maxCount: 1 }));

  return [
    upload.fields(multerFields),
    async (req, res, next) => {
      try {
        if (!req.files || Object.keys(req.files).length === 0) {
          return res.status(400).json({ message: "No media files uploaded" });
        }

        req.uploadedFiles = [];

        for (const field of fields) {
          const file = req.files[field]?.[0];
          if (!file) continue;

          if (!allowedMediaTypes.includes(file.mimetype)) {
            return res.status(400).json({
              message: `Invalid media type for field "${field}". Only audio/video allowed.`,
            });
          }

          const filename = file.originalname;
          const objectName = subfolder ? `${subfolder}/${filename}` : filename;

          await minioClient.putObject(
            minio.bucketReport,
            objectName,
            file.buffer,
            file.size,
            { "Content-Type": file.mimetype }
          );

          req.uploadedFiles.push({
            field,
            type: file.mimetype.startsWith("video") ? "VIDEO" : "AUDIO",
            filename: objectName,
            originalName: file.originalname,
          });
        }

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
