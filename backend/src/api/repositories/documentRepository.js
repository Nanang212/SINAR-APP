const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { findAllBuilder } = require("../utils/query");
const { deleteFile } = require("../utils/minioHelper");
const { baseUrl } = require("../../config/dotenv");

exports.findAllDocuments = async (params) => {
  return await findAllBuilder({
    model: prisma.document,
    params: {
      ...params,
      where: {
        is_active: true,
        ...params?.where,
      },
    },
    customSelect: {
      id: true,
      title: true,
      filename: true,
      original_name: true,
      url: true,
      uploaded_at: true,
      is_downloaded: true,
      is_active: true,
      remark: true,
      createdBy: true,
      updatedBy: true,
      uploader: {
        select: {
          username: true,
        },
      },
      kategori: {
        select: {
          id: true,
          name: true,
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
      title: true,
      filename: true,
      original_name: true,
      url: true,
      uploaded_at: true,
      is_downloaded: true,
      remark: true,
      createdBy: true,
      updatedBy: true,
      uploader: {
        select: {
          username: true,
        },
      },
      kategori: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

exports.createDocument = async ({ data, createdBy }) => {
  try {
    const { kategoriIds, ...rest } = data;

    // Langkah 1: Buat dokumen
    const newDoc = await prisma.document.create({
      data: {
        ...rest,
        is_active: true,
        createdBy: createdBy || "system",
        updatedBy: createdBy || "system",
        kategori: {
          connect: kategoriIds?.map((id) => ({ id })),
        },
      },
      include: {
        kategori: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Langkah 2: Generate URL download
    const downloadUrl = `${baseUrl}/api/v1/documents/download/${newDoc.id}`;

    // Langkah 3: Update URL ke database
    const updatedDoc = await prisma.document.update({
      where: { id: newDoc.id },
      data: {
        url: downloadUrl,
      },
      include: {
        kategori: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      message: "Document created successfully",
      data: updatedDoc,
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

    const { kategoriIds, filename, ...rest } = data;

    let newUrl = undefined;

    if (filename && existing.filename && filename !== existing.filename) {
      await deleteFile(existing.filename);

      // generate url baru karena file baru diupload
      newUrl = `${baseUrl}/api/v1/documents/download/${id}`;
    }

    const updated = await prisma.document.update({
      where: { id },
      data: {
        ...rest,
        ...(filename && { filename }),
        ...(newUrl && { url: newUrl }), // simpan url baru jika ada
        updatedBy: updatedBy || "system",
        ...(kategoriIds && {
          kategori: {
            set: kategoriIds.map((id) => ({ id })),
          },
        }),
      },
      include: {
        kategori: {
          select: {
            id: true,
            name: true,
          },
        },
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
