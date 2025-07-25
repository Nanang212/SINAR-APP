const documentRepository = require("../repositories/documentRepository");
const minioClient = require("../../config/minioClient");
const { minio } = require("../../config/dotenv");

exports.getAllDocuments = async (params) => {
  return await documentRepository.findAllDocuments(params);
};

exports.getDocumentById = async (id) => {
  return await documentRepository.findDocumentById(id);
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

  if (!doc || !doc.is_active) {
    throw { code: 404, message: "Document not found or inactive" };
  }

  if (user.role !== "admin" && doc.category_id !== user.category_id) {
    throw { code: 403, message: "Forbidden: You can't access this document" };
  }

  try {
    const fileStream = await new Promise((resolve, reject) => {
      minioClient.getObject(minio.bucketDocument, doc.filename, (err, stream) => {
        if (err) return reject(err);
        resolve(stream);
      });
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
