const documentService = require("../services/dokumentService");
const {
  successList,
  errorStatus,
  notFound,
  successCreate,
  successUpdate,
  successDelete,
} = require("../utils/response");

const { baseUrl } = require("../../config/dotenv");

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

exports.getAllDocuments = async (req, res) => {
  try {
    // Ambil parameter filter tanggal dan is_report dari query
    const { start_date, end_date, is_report } = req.query;

    // Buat where condition untuk filter tanggal
    let dateFilter = {};

    if (start_date || end_date) {
      dateFilter.uploaded_at = {};

      if (start_date) {
        // Set ke awal hari (00:00:00)
        const startDateTime = new Date(start_date);
        startDateTime.setHours(0, 0, 0, 0);
        dateFilter.uploaded_at.gte = startDateTime;
      }

      if (end_date) {
        // Set ke akhir hari (23:59:59)
        const endDateTime = new Date(end_date);
        endDateTime.setHours(23, 59, 59, 999);
        dateFilter.uploaded_at.lte = endDateTime;
      }
    }

    // Buat filter untuk is_report
    let reportFilter = {};
    if (is_report !== undefined && is_report !== '') {
      const hasReport = is_report === 'true';
      reportFilter.is_report = hasReport;
    }

    // Gabungkan dengan query parameters yang sudah ada
    const queryParams = {
      ...req.query,
      where: {
        ...dateFilter,
        ...reportFilter,
        ...req.query.where,
      },
    };

    const result = await documentService.getAllDocuments(queryParams);

    let filtered = result.data;

    if (req.user.role !== "admin") {
      filtered = filtered.filter((doc) =>
        doc.kategori.some((kat) => kat.id === req.user.category_id)
      );
    }

    const formattedData = filtered.map((doc) => ({
      id: doc.id,
      title: doc.title,
      remark: doc.remark,
      filename: doc.filename,
      original_name: doc.original_name,
      url: `${baseUrl}/api/v1/documents/download/${doc.id}`,
      is_downloaded: doc.is_downloaded,
      is_report: doc.is_report,
      uploaded_by: doc.uploaded_by,
      uploaded_at: doc.uploaded_at,
      createdBy: doc.createdBy,
      updatedBy: doc.updatedBy,
      is_active: doc.is_active,
      username_upload: doc.uploader?.username,
      categories: doc.kategori.map((c) => ({ id: c.id, name: c.name })),
      reports: doc.reports || [], 
    }));

    return successList(res, "Success getting all documents", {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasNext: result.hasNext,
      hasPrev: result.hasPrev,
      data: formattedData,
    });
  } catch (err) {
    console.error("GetAllDocuments Error:", err);
    return errorStatus(res, 500, "Failed to get documents");
  }
};

exports.getDocumentById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const doc = await documentService.getDocumentById(id);

    if (!doc) {
      return notFound(res, "Document not found");
    }

    const formatted = {
      id: doc.id,
      title: doc.title,
      remark: doc.remark,
      filename: doc.filename,
      original_name: doc.original_name,
      url: `${baseUrl}/api/v1/documents/download/${doc.id}`,
      is_downloaded: doc.is_downloaded,
      is_report: doc.is_report,
      uploaded_by: doc.uploader,
      uploaded_at: doc.uploaded_at,
      createdBy: doc.createdBy,
      updatedBy: doc.updatedBy,
      is_active: doc.is_active,
      username_upload: doc.uploader?.username,
      categories: doc.kategori.map((c) => ({ id: c.id, name: c.name })),
      reports: doc.reports || [], 
    };

    return successList(res, "Success getting document by id", [formatted]);
  } catch (err) {
    console.error("GetDocumentById Error:", err);
    return errorStatus(res, 500, "Failed to get document by id");
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return errorStatus(res, 400, "No file uploaded");
    }

    const { title, category_ids, remark } = req.body;
    if (!category_ids) {
      return errorStatus(res , 400, "Category IDs are required");
    }

    const categoryIdArray = Array.isArray(category_ids)
      ? category_ids.map((id) => parseInt(id))
      : String(category_ids)
          .split(",")
          .map((id) => parseInt(id.trim()));

    if (categoryIdArray.some(isNaN)) {
      return errorStatus(res , 400, "Invalid category ID format");
    }

    const result = await documentService.createDocument({
      data: {
        filename: req.minioFilename,
        original_name: file.originalname,
        title: title || null,
        remark: remark || null,
        uploaded_by: req.user.id,
        kategoriIds: categoryIdArray,
        url: null,
      },
      createdBy: req.user.name || "system",
    });

    if (!result.success) {
      return errorStatus(res, 500, result.msg || "Failed to create document");
    }

    const docId = result.data.id;
    const downloadUrl = `${baseUrl}/api/v1/documents/download/${docId}`;

    return successCreate(res, "Document uploaded successfully", {
      ...result.data,
      url: downloadUrl,
    });
  } catch (err) {
    console.error("uploadDocument error:", err);
    return errorStatus(res , 500, "Internal server error");
  }
};

exports.updateDocument = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const file = req.file;
    const { category_ids, title, remark } = req.body;

    if (file && file.size > MAX_FILE_SIZE) {
      return errorStatus(res, 400, "File size exceeds the limit of 10MB");
    }

    const categoryIdArray = Array.isArray(category_ids)
      ? category_ids.map((id) => parseInt(id))
      : String(category_ids)
          .split(",")
          .map((id) => parseInt(id.trim()));

    const data = {
      ...(title && { title }),
      ...(remark && { remark }),
      ...(file && {
        filename: req.minioFilename,
        original_name: file.originalname,
        is_downloaded: false,
      }),
      kategoriIds: categoryIdArray,
    };

    const result = await documentService.updateDocument(
      id,
      data,
      req.user?.name || "system"
    );

    if (!result.success) {
      if (result.code === 404) return notFound(res, result.msg);
      return errorStatus(res, 500, result.msg);
    }

    return successUpdate(res, "Document updated successfully", result.data);
  } catch (err) {
    console.error("UpdateDocument Error:", err);
    return errorStatus(res, 500, "Failed to update document");
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    const result = await documentService.deleteDocument(
      id,
      req.user?.name || "system"
    );

    if (!result.success) {
      if (result.code === 404) return notFound(res, result.msg);
      return errorStatus(res, 500, result.msg);
    }

    return successDelete(res, "Document deleted successfully", result.data);
  } catch (err) {
    console.error("DeleteDocument Error:", err);
    return errorStatus(res, 500, "Failed to delete document");
  }
};

exports.downloadDocument = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    const { stream, filename } = await documentService.downloadDocument({
      id,
      user: req.user,
    });

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/octet-stream");

    stream.pipe(res);
  } catch (err) {
    console.error("DownloadDocument Error:", err);
    const code = err.code || 500;
    const message = err.message || "Failed to download document";

    return res.status(code).json({
      status: false,
      code,
      message,
    });
  }
};

exports.previewDocument = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await documentService.previewDocument({ id, user: req.user, req, res });
    // streaming handled directly by service via helper
  } catch (err) {
    console.error("PreviewDocument Error:", err);
    const code = err.code || 500;
    const message = err.message || "Failed to preview document";

    return res.status(code).json({
      status: false,
      code,
      message,
    });
  }
};
