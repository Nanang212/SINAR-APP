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

exports.getAllReports = async (req, res) => {
  try {
    const result = await documentReportService.getAllReports(req.query);
    const host = `${baseUrl}`;
    const reports = Array.isArray(result?.data) ? result.data : [];

    const formatted = reports.map((report) => ({
      id: report.id,
      type: report.type,
      content: report.content
        ? `${host}/api/v1/admin/reports/download/${report.id}`
        : null,
      preview_url: report.content
        ? `${host}/api/v1/admin/reports/preview/${report.id}`
        : null,
      original_name: report.original_name,
      description: report.description,
      is_downloaded: report.is_downloaded,
      downloaded_at: report.downloaded_at,
      created_at: report.created_at,
      created_by: report.created_by,
      updated_at: report.updated_at,
      updated_by: report.updated_by,
      document: report.document
        ? {
            ...report.document,
            url: `${host}/api/v1/documents/download/${report.document.id}`,
          }
        : null,
      user: report.user,
    }));

    successList(res, "Successfully fetched reports", {
      ...result,
      data: formatted,
    });
  } catch (err) {
    errorStatus(res, err.code || 500, err.message);
  }
};

exports.getReportById = async (req, res) => {
  try {
    const report = await documentReportService.getReportById(+req.params.id);
    if (!report) return notFound(res, "Report not found");

    const host = `${baseUrl}`;
    const formatted = {
      id: report.id,
      type: report.type,
      content: report.content
        ? `${host}/api/v1/reports/download/${report.id}`
        : null,
      preview_url: report.content
        ? `${host}/api/v1/admin/reports/preview/${report.id}`
        : null,
      original_name: report.original_name,
      description: report.description,
      is_downloaded: report.is_downloaded,
      downloaded_at: report.downloaded_at,
      created_at: report.created_at,
      created_by: report.created_by,
      updated_at: report.updated_at,
      updated_by: report.updated_by,
      document: report.document
        ? {
            ...report.document,
            url: `${host}/api/v1/documents/download/${report.document.id}`,
          }
        : null,
      user: report.user,
    };

    successList(res, "Report found", [formatted]);
  } catch (err) {
    errorStatus(res, err.code || 500, err.message);
  }
};

exports.createReport = async (req, res) => {
  try {
    const files = req.uploadedFiles || [];

    // Validasi ukuran file tiap jenis
    for (const file of files) {
      const isVideo = file.type === "VIDEO";
      const isAudio = file.type === "AUDIO";

      if (isVideo && file.size > 500 * 1024 * 1024) {
        return errorStatus(
          res,
          400,
          `Video file ${file.originalName} exceeds 500MB limit`
        );
      }

      if (isAudio && file.size > 30 * 1024 * 1024) {
        return errorStatus(
          res,
          400,
          `Audio file ${file.originalName} exceeds 30MB limit`
        );
      }
    }

    const createdReports = [];

    for (const file of files) {
      const data = {
        ...req.body,
        type: file.type,
        content: file.filename,
        original_name: file.originalName,
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
          ? `${host}/api/v1/admin/reports/download/${result.data.id}`
          : null,
        document: result.data.document
          ? {
              ...result.data.document,
              url: `${host}/api/v1/documents/download/${result.data.document.id}`,
            }
          : null,
      };

      createdReports.push(formatted);
    }

    successCreate(res, "Multiple reports created", createdReports);
  } catch (err) {
    console.error("CreateReport Error:", err);
    errorStatus(res, err.code || 500, err.message);
  }
};

exports.updateReport = async (req, res) => {
  try {
    const id = +req.params.id;
    const files = req.uploadedFiles || [];

    // Validasi size untuk masing-masing file
    for (const file of files) {
      if (file.type === "VIDEO" && file.size > 500 * 1024 * 1024) {
        return errorStatus(res, 400, "Video size exceeds 500MB limit");
      }
      if (file.type === "AUDIO" && file.size > 30 * 1024 * 1024) {
        return errorStatus(res, 400, "Audio size exceeds 30MB limit");
      }
    }

    const results = [];

    for (const file of files) {
      const updatedData = {
        content: file.filename,
        original_name: file.originalName,
        type: file.type,
        description: req.body.description,
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

      results.push(formatted);
    }

    successUpdate(res, "Reports updated", results);
  } catch (err) {
    console.error("UpdateReport Error:", err);
    errorStatus(res, err.code || 500, err.message);
  }
};

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

exports.previewReportMedia = async (req, res) => {
  try {
    const reportId = +req.params.id;
    const report = await documentReportService.getReportById(reportId);

    if (!report) return notFound(res, "Report not found");

    const user = req.user;

    // Optional: validasi akses berdasarkan kategori jika perlu
    if (
      user.role !== "admin" &&
      report.document?.kategori?.id !== user.category_id
    ) {
      return errorStatus(res, 403, "Forbidden: You can't access this report");
    }

    const filename = report.content;
    if (!filename) {
      return errorStatus(res, 400, "No media file associated with this report");
    }

    await documentReportService.previewReportMedia({
      filename,
      req,
      res,
    });
  } catch (err) {
    console.error("PreviewReportMedia Error:", err);
    errorStatus(res, err.code || 500, err.message);
  }
};
