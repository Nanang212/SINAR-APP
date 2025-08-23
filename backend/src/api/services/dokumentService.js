const documentRepository = require("../repositories/documentRepository");
const minioClient = require("../../config/minioClient");
const { minio, baseUrl } = require("../../config/dotenv");
const { streamDocument } = require("../utils/minioHelper");

// Helper function untuk format reports dengan URL
const formatReportsWithUrls = (reports) => {
  if (!reports || reports.length === 0) return null;
  
  return reports.map(report => ({
    ...report,
    download_url: ["AUDIO", "VIDEO"].includes(report.type) && report.id
      ? `${baseUrl}/api/v1/admin/reports/download/${report.id}`
      : null,
    preview_url: ["AUDIO", "VIDEO"].includes(report.type) && report.id
      ? `${baseUrl}/api/v1/admin/reports/preview/${report.id}`
      : null,
  }));
};

exports.getAllDocuments = async (params) => {
  const result = await documentRepository.findAllDocuments(params);
  
  // Format reports dengan URL untuk setiap document
  if (result.data && Array.isArray(result.data)) {
    result.data = result.data.map(doc => ({
      ...doc,
      reports: formatReportsWithUrls(doc.reports),
    }));
  }
  
  return result;
};

exports.getDocumentById = async (id) => {
  const document = await documentRepository.findDocumentById(id);
  
  if (document) {
    document.reports = formatReportsWithUrls(document.reports);
  }
  
  return document;
};

exports.createDocument = async ({ data, createdBy }) => {
  return await documentRepository.createDocument({ data, createdBy });
};

exports.updateDocument = async (id, data, updatedBy) => {
  return await documentRepository.updateDocument(id, data, updatedBy);
};

exports.deleteDocument = async (id, updatedBy) => {
  return await documentRepository.deleteDocument(id, updatedBy);
};

exports.downloadDocument = async ({ id, user }) => {
  const doc = await documentRepository.findDocumentById(id);

  if (!doc) {
    throw { code: 404, message: "Document not found or inactive" };
  }

  const isAdmin = user.role?.toLowerCase() === "admin";
  const allowed = doc.kategori?.some((cat) => cat.id === user.category_id);

  if (!isAdmin && !allowed) {
    throw { code: 403, message: "Forbidden: You can't access this document" };
  }
  try {
    const fileStream = await new Promise((resolve, reject) => {
      minioClient.getObject(
        minio.bucketDocument,
        doc.filename,
        (err, stream) => {
          if (err) return reject(err);
          resolve(stream);
        }
      );
    });

    if (!doc.is_downloaded) {
      await documentRepository.updateDocument(
        id,
        { is_downloaded: true },
        user.name
      );
    }

    return { stream: fileStream, filename: doc.original_name || doc.filename };
  } catch (error) {
    console.error("DownloadDocument Error:", error);
    throw { code: 500, message: "Failed to download document from MinIO" };
  }
};

exports.previewDocument = async ({ id, user, req, res }) => {
  const doc = await documentRepository.findDocumentById(id);

  if (!doc) {
    throw { code: 404, message: "Document not found or inactive" };
  }

  const isAdmin = user.role?.toLowerCase() === "admin";
  const allowed = doc.kategori?.some((cat) => cat.id === user.category_id);

  if (!isAdmin && !allowed) {
    throw { code: 403, message: "Forbidden: You can't access this document" };
  }

  // ✅ Gunakan helper untuk streaming preview
  await streamDocument(doc.filename, req, res);
};
