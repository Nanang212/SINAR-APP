// ✅ FINAL VERSION - documentReportService.js
const documentReportRepository = require("../repositories/documentReportRepository");
const documentRepository = require("../repositories/documentRepository");
const minioClient = require("../../config/minioClient");
const { minio } = require("../../config/dotenv");
const { streamMedia, deleteReportMedia } = require("../utils/minioHelper");

// ✅ Get all document reports
exports.getAllReports = async (params) => {
  return await documentReportRepository.findAllReports(params);
};

// 🔍 Get single report by ID
exports.getReportById = async (id) => {
  return await documentReportRepository.findReportById(id);
};

// ➕ Create new report
exports.createReport = async ({ data, user }) => {
  // 1. Validasi document_id
  if (!data.document_id || isNaN(+data.document_id)) {
    throw {
      code: 400,
      message: "document_id is required and must be a number",
    };
  }

  // 2. Cek dokumen
  const doc = await documentRepository.findDocumentById(+data.document_id);
  if (!doc) {
    throw { code: 404, message: "Document not found" };
  }

  // 3. Cek akses kategori
  if (user.role !== "admin" && doc.category_id !== user.category_id) {
    throw {
      code: 403,
      message: "Forbidden: You can't submit report for this document",
    };
  }

  // 4. Validasi type
  const allowedTypes = ["TEXT", "LINK", "AUDIO", "VIDEO"];
  if (!allowedTypes.includes(data.type)) {
    throw {
      code: 400,
      message: `Invalid report type. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  // 5. Simpan ke DB
  return await documentReportRepository.createReport({
    data: {
      ...data,
      document_id: +data.document_id,
      user_id: user.id,
    },
    createdBy: user.id,
  });
};

// ✏️ Update existing report (support re-upload media)
exports.updateReport = async (id, data, user) => {
  const existing = await documentReportRepository.findReportById(id);
  if (!existing) {
    throw { code: 404, message: "Report not found" };
  }

  const doc = existing.document;
  if (!doc || (user.role !== "admin" && doc.category_id !== user.category_id)) {
    throw {
      code: 403,
      message: "Forbidden: You can't update this report",
    };
  }

  const allowedTypes = ["TEXT", "LINK", "AUDIO", "VIDEO"];
  if (data.type && !allowedTypes.includes(data.type)) {
    throw {
      code: 400,
      message: `Invalid report type. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  // 🗑️ Delete old media file if new media is uploaded
  if (data.content && data.original_name && existing.content) {
    const oldFileType = existing.type;
    if (oldFileType === "AUDIO" || oldFileType === "VIDEO") {
      await deleteReportMedia(existing.content);
    }
  }

  if (data.content || data.original_name) {
    data.is_downloaded = false;
    data.downloaded_at = null;
  }

  return await documentReportRepository.updateReport(
    id,
    {
      ...data,
      updated_by: user.id,
    },
    user.id
  );
};

// ❌ Delete report
exports.deleteReport = async (id) => {
  // Get report data before deletion to access file info
  const existing = await documentReportRepository.findReportById(id);
  if (existing && existing.content) {
    const fileType = existing.type;
    if (fileType === "AUDIO" || fileType === "VIDEO") {
      await deleteReportMedia(existing.content);
    }
  }
  
  return await documentReportRepository.deleteReport(id);
};

// 📥 Download media (audio/video) in report
exports.downloadReportMedia = async ({ reportId, user }) => {
  const report = await documentReportRepository.findReportById(reportId);
  if (!report) {
    throw { code: 404, message: "Report not found" };
  }

  const doc = report.document;
  if (
    !doc ||
    (user.role !== "admin" && doc.kategori?.id !== user.category_id)
  ) {
    throw {
      code: 403,
      message: "Forbidden: You can't access this report",
    };
  }

  const filePath = report.content;
  const filename = report.original_name || "media";

  try {
    const stream = await new Promise((resolve, reject) => {
      minioClient.getObject(minio.bucketReport, filePath, (err, fileStream) => {
        if (err) return reject(err);
        resolve(fileStream);
      });
    });

    if (!report.is_downloaded) {
      await documentReportRepository.markReportAsDownloaded(reportId, user.id);
    }

    return { stream, filename };
  } catch (error) {
    console.error("DownloadReportMedia Error:", error);
    throw { code: 500, message: "Failed to download media from MinIO" };
  }
};

exports.previewReportMedia = async ({ filename, req, res }) => {
  // Validasi filename
  if (!filename || typeof filename !== "string" || filename.includes("..")) {
    throw { code: 400, message: "Invalid or unsafe filename" };
  }

  try {
    // Lanjutkan ke streaming via helper
    await streamMedia(filename, req, res);
  } catch (err) {
    console.error("❌ StreamMedia failed:", err);
    throw {
      code: 500,
      message: "Failed to stream media from storage",
    };
  }
};
