const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { findAllBuilder } = require("../utils/query");

// 🔍 Find All Kategori
exports.findAllKategori = async (params) => {
  return await findAllBuilder({
    model: prisma.kategori,
    params: {
      ...params,
      where: {
        is_active: true,
        ...params?.where,
      },
    },
    customSelect: {
      id: true,
      name: true,
      is_active: true,
      created_at: true,
      created_by: true,
      updated_at: true,
      updated_by: true,
    },
    searchFields: ['name'],
  });
};

// 🔍 Find Kategori By ID
exports.findKategoriById = async (id) => {
  return await prisma.kategori.findFirst({
    where: {
      id,
      is_active: true,
    },
    select: {
      id: true,
      name: true,
      is_active: true,
      created_at: true,
      created_by: true,
      updated_at: true,
      updated_by: true,
    },
  });
};

// ➕ Create Kategori
exports.createKategori = async ({ data, createdBy }) => {
  try {
    const newKategori = await prisma.kategori.create({
      data: {
        ...data,
        is_active: true,
        created_by: createdBy || null,
        updated_by: createdBy || null,
      },
    });

    return {
      success: true,
      message: "Kategori created successfully",
      data: newKategori,
    };
  } catch (error) {
    console.error("Error in createKategori:", error);
    return { success: false, code: 500, msg: "Internal server error" };
  }
};

// ✏️ Update Kategori
exports.updateKategori = async (id, data, updatedBy) => {
  try {
    const existing = await prisma.kategori.findFirst({
      where: { id, is_active: true },
    });

    if (!existing) {
      return {
        success: false,
        code: 404,
        msg: "Kategori not found or inactive",
      };
    }

    const updated = await prisma.kategori.update({
      where: { id },
      data: {
        ...data,
        updated_by: updatedBy || null,
      },
    });

    return {
      success: true,
      message: "Kategori updated successfully",
      data: updated,
    };
  } catch (error) {
    console.error("Error in updateKategori:", error);
    return { success: false, code: 500, msg: "Internal server error" };
  }
};

// ❌ Soft Delete Kategori
exports.deleteKategori = async (id, updatedBy) => {
  try {
    const kategori = await prisma.kategori.findFirst({
      where: { id, is_active: true },
    });

    if (!kategori) {
      return {
        success: false,
        code: 404,
        msg: "Kategori not found or already inactive",
      };
    }

    const deleted = await prisma.kategori.update({
      where: { id },
      data: {
        is_active: false,
        name: `${kategori.name}_deleted_${Date.now()}`,
        updated_by: updatedBy || null,
      },
    });

    return {
      success: true,
      message: "Kategori deleted successfully",
      data: deleted,
    };
  } catch (error) {
    console.error("Error in deleteKategori:", error);
    return { success: false, code: 500, msg: "Internal server error" };
  }
};
