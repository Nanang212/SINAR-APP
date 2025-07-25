// ✅ FINAL VERSION - documentReportController.js
const documentReportService = require("../services/dokumentReportService");
const {
  successList,
  errorStatus,
  notFound,
  successCreate,
  successUpdate,
  successDelete,
} = require("../utils/response");
const { baseUrl } = require("../../config/dotenv");

// 📄 GET All Reports
exports.getAllReports = async (req, res) => {
  try {
    const data = await documentReportService.getAllReports(req.query);

    const host = `${baseUrl}`;
    const formatted = data.map((report) => ({
      ...report,
      content: report.content
        ? `${host}/api/v1/admin/reports/download/${report.id}`
        : null,
      document: report.document
        ? {
            ...report.document,
            url: `${host}/api/v1/documents/download/${report.document.id}`,
          }
        : null,
    }));

    successList(res, "Successfully fetched reports", formatted);
  } catch (err) {
    errorStatus(res, err.code || 500, err.message);
  }
};

// 🔍 GET Report by ID
exports.getReportById = async (req, res) => {
  try {
    const report = await documentReportService.getReportById(+req.params.id);
    if (!report) return notFound(res, "Report not found");

    const host = `${baseUrl}`;
    const formatted = {
      ...report,
      content: report.content
        ? `${host}/api/v1/reports/download/${report.id}`
        : null,
      document: report.document
        ? {
            ...report.document,
            url: `${host}/api/v1/documents/download/${report.document.id}`,
          }
        : null,
    };

    successList(res, "Report found", [formatted]);
  } catch (err) {
    errorStatus(res, err.code || 500, err.message);
  }
};

// ➕ CREATE Report
exports.createReport = async (req, res) => {
  try {
    const file = req.file;
    if (file) {
      const isVideo = file.mimetype.startsWith("video");
      const isAudio = file.mimetype.startsWith("audio");

      if (isVideo && file.size > 500 * 1024 * 1024) {
        return errorStatus(res, 400, "Video size exceeds 500MB limit");
      }

      if (isAudio && file.size > 30 * 1024 * 1024) {
        return errorStatus(res, 400, "Audio size exceeds 30MB limit");
      }
    }

    const data = {
      ...req.body,
      content: req.minioFilename,
      original_name: req.originalFileName,
    };

    const result = await documentReportService.createReport({
      data,
      user: req.user,
    });

    if (!result.success) {
      return errorStatus(res, result.code || 500, result.msg);
    }

    const host = `${baseUrl}`;
    const formatted = {
      ...result.data,
      content: result.data.content
        ? `${host}/api/v1/reports/download/${result.data.id}`
        : null,
      document: result.data.document
        ? {
            ...result.data.document,
            url: `${host}/api/v1/documents/download/${result.data.document.id}`,
          }
        : null,
    };

    successCreate(res, "Report created", formatted);
  } catch (err) {
    console.error("CreateReport Error:", err);
    errorStatus(res, err.code || 500, err.message);
  }
};

// ✏️ UPDATE Report
exports.updateReport = async (req, res) => {
  try {
    const file = req.file;
    const id = +req.params.id;

    if (file) {
      const isVideo = file.mimetype.startsWith("video");
      const isAudio = file.mimetype.startsWith("audio");

      if (isVideo && file.size > 500 * 1024 * 1024) {
        return errorStatus(res, 400, "Video size exceeds 500MB limit");
      }

      if (isAudio && file.size > 30 * 1024 * 1024) {
        return errorStatus(res, 400, "Audio size exceeds 30MB limit");
      }
    }

    const updatedData = {
      ...req.body,
      content: req.minioFilename || undefined,
      original_name: req.originalFileName || undefined,
    };

    const updated = await documentReportService.updateReport(
      id,
      updatedData,
      req.user
    );

    if (!updated.success) {
      return errorStatus(res, updated.code || 500, updated.msg);
    }

    const host = `${baseUrl}`;
    const formatted = {
      ...updated.data,
      content: updated.data.content
        ? `${host}/api/v1/reports/download/${updated.data.id}`
        : null,
      document: updated.data.document
        ? {
            ...updated.data.document,
            url: `${host}/api/v1/documents/download/${updated.data.document.id}`,
          }
        : null,
    };

    successUpdate(res, "Report updated", formatted);
  } catch (err) {
    console.error("UpdateReport Error:", err);
    errorStatus(res, err.code || 500, err.message);
  }
};

// ❌ DELETE Report
exports.deleteReport = async (req, res) => {
  try {
    const result = await documentReportService.deleteReport(+req.params.id);

    if (!result.success) {
      return errorStatus(res, result.code || 500, result.msg);
    }

    successDelete(res, "Report deleted");
  } catch (err) {
    errorStatus(res, err.code || 500, err.message);
  }
};

// 📥 DOWNLOAD Media
exports.downloadReportMedia = async (req, res) => {
  try {
    const { stream, filename } =
      await documentReportService.downloadReportMedia({
        reportId: +req.params.id,
        user: req.user,
      });

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    stream.pipe(res);
  } catch (err) {
    errorStatus(res, err.code || 500, err.message);
  }
};
