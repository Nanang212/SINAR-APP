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
    const data = await documentService.getAllDocuments(req.query);

    if (!data || data.length === 0) {
      return notFound(res, "No documents found");
    }

    const filtered =
      req.user.role === "admin"
        ? data
        : data.filter((doc) =>
            doc.kategori.some((kat) => kat.id === req.user.category_id)
          );

    const formattedData = filtered.map((doc) => ({
      id: doc.id,
      title: doc.title,
      remark: doc.remark,
      filename: doc.filename,
      original_name: doc.original_name,
      url: `${baseUrl}/api/v1/documents/download/${doc.id}`,
      is_downloaded: doc.is_downloaded,
      uploaded_by: doc.uploaded_by,
      uploaded_at: doc.uploaded_at,
      createdBy: doc.createdBy,
      updatedBy: doc.updatedBy,
      is_active: doc.is_active,
      username_upload: doc.uploader?.username,
      categories: doc.kategori.map((c) => ({ id: c.id, name: c.name })),
    }));

    return successList(res, "Success getting all documents", formattedData);
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
      uploaded_by: doc.uploader,
      uploaded_at: doc.uploaded_at,
      createdBy: doc.createdBy,
      updatedBy: doc.updatedBy,
      is_active: doc.is_active,
      username_upload: doc.uploader?.username,
      categories: doc.kategori.map((c) => ({ id: c.id, name: c.name })),
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
      return errorStatus(res, "No file uploaded", 400);
    }

    const { title, category_ids, remark } = req.body;
    if (!category_ids) {
      return errorStatus(res, "Category IDs are required", 400);
    }

    const categoryIdArray = Array.isArray(category_ids)
      ? category_ids.map((id) => parseInt(id))
      : String(category_ids)
          .split(",")
          .map((id) => parseInt(id.trim()));

    if (categoryIdArray.some(isNaN)) {
      return errorStatus(res, "Invalid category ID format", 400);
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
      return errorStatus(res, result.msg || "Failed to create document", 500);
    }

    const docId = result.data.id;
    const downloadUrl = `${baseUrl}/api/v1/documents/download/${docId}`;

    return successCreate(res, "Document uploaded successfully", {
      ...result.data,
      url: downloadUrl,
    });
  } catch (err) {
    console.error("uploadDocument error:", err);
    return errorStatus(res, "Internal server error", 500);
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
