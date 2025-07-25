const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { findAllBuilder } = require("../utils/query");

exports.findAllDocuments = async (params) => {
  return await findAllBuilder({
    model: prisma.document,
    params: {
      ...params,
      where: {
        is_active: true,
        ...params.where,
      },
    },
    customSelect: {
      id: true,
      filename: true,
      original_name: true,
      url: true,
      category_id: true,
      uploaded_by: true,
      uploaded_at: true,
      createdBy: true,
      updatedBy: true,
      is_active: true,
      is_downloaded: true, 
      uploader: {
        select: {
          username: true,
        },
      },
    },
  });
};

exports.findDocumentById = async (id) => {
  return await prisma.document.findFirst({
    where: {
      id: Number(id),
      is_active: true,
    },
    select: {
      id: true,
      filename: true,
      original_name: true,
      url: true,
      category_id: true,
      uploaded_by: true,
      uploaded_at: true,
      createdBy: true,
      updatedBy: true,
      is_active: true,
      is_downloaded: true, 
      uploader: {
        select: {
          username: true,
        },
      },
    },
  });
};

exports.createDocument = async ({ data, createdBy }) => {
  try {
    const newDoc = await prisma.document.create({
      data: {
        ...data,
        is_active: true,
        createdBy: createdBy || "system",
        updatedBy: createdBy || "system",
      },
    });

    return {
      success: true,
      message: "Document created successfully",
      data: newDoc,
    };
  } catch (error) {
    console.error("Error in createDocument:", error);
    return { success: false, code: 500, msg: "Internal server error" };
  }
};

exports.updateDocument = async (id, data, updatedBy) => {
  try {
    const existing = await prisma.document.findFirst({
      where: { id, is_active: true },
    });

    if (!existing) {
      return {
        success: false,
        code: 404,
        msg: "Document not found or inactive",
      };
    }

    const updated = await prisma.document.update({
      where: { id },
      data: {
        ...data,
        updatedBy: updatedBy || "system",
      },
    });

    return {
      success: true,
      message: "Document updated successfully",
      data: updated,
    };
  } catch (error) {
    console.error("Error in updateDocument:", error);
    return { success: false, code: 500, msg: "Internal server error" };
  }
};

exports.deleteDocument = async (id, updatedBy) => {
  try {
    const existing = await prisma.document.findFirst({
      where: { id, is_active: true },
    });

    if (!existing) {
      return {
        success: false,
        code: 404,
        msg: "Document not found or already inactive",
      };
    }

    const deleted = await prisma.document.update({
      where: { id },
      data: {
        is_active: false,
        updatedBy: updatedBy || "system",
      },
    });

    return {
      success: true,
      message: "Document deleted successfully",
      data: deleted,
    };
  } catch (error) {
    console.error("Error in deleteDocument:", error);
    return { success: false, code: 500, msg: "Internal server error" };
  }
};
