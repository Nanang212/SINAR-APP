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

exports.getAllReports = async (req, res) => {
  try {
    const result = await documentReportService.getAllReports(req.query);

    successList(res, "Successfully fetched reports", {
      ...result,
      data: result?.data || [],
    });
  } catch (err) {
    console.error("getAllReports Error:", err);
    errorStatus(res, err.code || 500, err.message);
  }
};

exports.getReportById = async (req, res) => {
  try {
    const report = await documentReportService.getReportById(+req.params.id);
    if (!report) return notFound(res, "Report not found");

    successList(res, "Report found", [report]);
  } catch (err) {
    console.error("getReportById Error:", err);
    errorStatus(res, err.code || 500, err.message);
  }
};

exports.createReport = async (req, res) => {
  try {
    const files = req.uploadedFiles || [];
    const createdReports = [];

    // ✅ Proses AUDIO / VIDEO dari file
    for (const file of files) {
      const isVideo = file.type === "VIDEO";
      const isAudio = file.type === "AUDIO";

      // Validasi ukuran
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

      createdReports.push(result.data);
    }

    // ✅ Proses LINK (dari field "link")
    if (req.body.link) {
      const result = await documentReportService.createReport({
        data: {
          ...req.body,
          type: "LINK",
          content: req.body.link,
          original_name: null,
        },
        user: req.user,
      });

      if (!result.success) {
        return errorStatus(res, result.code || 500, result.msg);
      }

      createdReports.push(result.data);
    }

    // ✅ Proses TEXT (dari field "text")
    if (req.body.text) {
      const result = await documentReportService.createReport({
        data: {
          ...req.body,
          type: "TEXT",
          content: req.body.text,
          original_name: null,
        },
        user: req.user,
      });

      if (!result.success) {
        return errorStatus(res, result.code || 500, result.msg);
      }

      createdReports.push(result.data);
    }

    return successCreate(res, "Reports created successfully", createdReports);
  } catch (err) {
    console.error("CreateReport Error:", err);
    return errorStatus(res, err.code || 500, err.message);
  }
};

exports.updateReport = async (req, res) => {
  try {
    const id = +req.params.id;
    const files = req.uploadedFiles || [];

    // Validasi size
    for (const file of files) {
      if (file.type === "VIDEO" && file.size > 500 * 1024 * 1024) {
        return errorStatus(res, 400, "Video size exceeds 500MB limit");
      }
      if (file.type === "AUDIO" && file.size > 30 * 1024 * 1024) {
        return errorStatus(res, 400, "Audio size exceeds 30MB limit");
      }
    }

    const updatedReports = [];

    if (files.length > 0) {
      for (const file of files) {
        const updatedData = {
          content: file.filename,
          original_name: file.originalName,
          type: file.type,
          description: req.body.description,
        };

        const result = await documentReportService.updateReport(
          id,
          updatedData,
          req.user
        );

        if (!result.success) {
          return errorStatus(res, result.code || 500, result.msg);
        }

        updatedReports.push(result.data);
      }
    } else {
      // Update selain file (e.g. TEXT, LINK, atau hanya deskripsi)
      const updateData = {
        description: req.body.description,
      };

      // Auto-detect type berdasarkan field yang dikirim
      if (req.body.link) {
        updateData.type = "LINK";
        updateData.content = req.body.link;
      } else if (req.body.text) {
        updateData.type = "TEXT";
        updateData.content = req.body.text;
      } else if (req.body.content) {
        // Fallback jika menggunakan field 'content' langsung
        updateData.content = req.body.content;
        if (req.body.type) {
          updateData.type = req.body.type.toUpperCase();
        }
      }
      // Jika tidak ada field content/link/text, hanya update description

      const result = await documentReportService.updateReport(
        id,
        updateData,
        req.user
      );

      if (!result.success) {
        return errorStatus(res, result.code || 500, result.msg);
      }

      updatedReports.push(result.data);
    }

    return successUpdate(res, "Reports updated", updatedReports);
  } catch (err) {
    console.error("UpdateReport Error:", err);
    return errorStatus(res, err.code || 500, err.message);
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
