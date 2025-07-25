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

// 🔍 Get all documents (filtered by user category if not admin)
exports.getAllDocuments = async (req, res) => {
  try {
    const filters =
      req.user.role !== "admin" ? { category_id: req.user.category_id } : {};

    const data = await documentService.getAllDocuments({
      ...req.query,
      where: filters,
    });

    if (!data || data.length === 0) {
      return notFound(res, "No documents found");
    }

    const formattedData = data.map((doc) => ({
      id: doc.id,
      filename: doc.filename,
      original_name: doc.original_name,
      url: `${baseUrl}/api/v1/documents/download/${doc.id}`,
      category_id: doc.category_id,
      uploaded_by: doc.uploaded_by,
      uploaded_at: doc.uploaded_at,
      createdBy: doc.createdBy,
      updatedBy: doc.updatedBy,
      is_active: doc.is_active,
      username_upload: doc.uploader?.username,
    }));

    return successList(res, "Success getting all documents", formattedData);
  } catch (err) {
    console.error("GetAllDocuments Error:", err);
    return errorStatus(res, 500, "Failed to get documents");
  }
};

// 🔍 Get single document by ID
exports.getDocumentById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const doc = await documentService.getDocumentById(id);

    if (!doc) {
      return notFound(res, "Document not found");
    }

    const formatted = {
      id: doc.id,
      filename: doc.filename,
      original_name: doc.original_name,
      url: `${baseUrl}/api/v1/documents/download/${doc.id}`,
      category_id: doc.category_id,
      uploaded_by: doc.uploaded_by,
      uploaded_at: doc.uploaded_at,
      createdBy: doc.createdBy,
      updatedBy: doc.updatedBy,
      is_active: doc.is_active,
      username_upload: doc.uploader?.username,
    };

    return successList(res, "Success getting document by id", [formatted]);
  } catch (err) {
    console.error("GetDocumentById Error:", err);
    return errorStatus(res, 500, "Failed to get document by id");
  }
};

// ⬆️ Upload document (admin only)
exports.uploadDocument = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return errorStatus(res, 403, "Only admin can upload documents");
    }

    const file = req.file;
    const { category_id } = req.body;

    if (!file) return errorStatus(res, 400, "File is required");
    if (file.size > MAX_FILE_SIZE)
      return errorStatus(res, 400, "File size exceeds the limit of 10MB");
    if (!category_id) return errorStatus(res, 400, "Category ID is required");

    const result = await documentService.createDocument({
      data: {
        filename: req.minioFilename,
        original_name: file.originalname,
        category_id: parseInt(category_id),
        uploaded_by: req.user.id,
      },
      createdBy: req.user.name || "system",
    });

    if (!result.success) {
      return errorStatus(res, 500, result.msg);
    }

    const docId = result.data.id;
    const downloadUrl = `${baseUrl}/api/v1/documents/download/${docId}`;

    return successCreate(res, "Document uploaded successfully", {
      ...result.data,
      url: downloadUrl,
    });
  } catch (err) {
    console.error("UploadDocument Error:", err);
    return errorStatus(res, 500, "Failed to upload document");
  }
};

// ✏️ Update document (optional file or category change)
exports.updateDocument = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const file = req.file;
    const { category_id } = req.body;

    if (file && file.size > MAX_FILE_SIZE) {
      return errorStatus(res, 400, "File size exceeds the limit of 10MB");
    }

    const data = {
      ...(category_id && { category_id: parseInt(category_id) }),
      ...(file && {
        filename: req.minioFilename,
        original_name: file.originalname,
      }),
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

// ❌ Delete document (soft delete)
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

// 📥 Download document (with role + category validation in service)
exports.downloadDocument = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    const { stream, filename } = await documentService.downloadDocument({
      id,
      user: req.user,
    });

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/octet-stream");

    // ✅ Kirim stream file
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
