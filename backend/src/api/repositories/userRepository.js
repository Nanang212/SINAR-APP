const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const { findAllBuilder } = require("../utils/query");
const { deleteFile } = require("../utils/minioHelper");

exports.findAllUsers = async (params) => {
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;

  return await findAllBuilder({
    model: prisma.user,
    params: {
      ...params,
      page, // Overwrite with Number type
      limit, // Overwrite with Number type
      where: {
        is_active: true,
        ...params?.where,
      },
    },
    customSelect: {
      id: true,
      username: true,
      name_mentri: true,
      contact_person: true,
      filepath: true,
      original_name: true,
      created_at: true,
      updated_at: true,
      created_by: true,
      updated_by: true,
      is_active: true,
      role: {
        select: {
          id: true,
          name: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    searchFields: ['username', 'name_mentri'],
  });
}; 

exports.createUser = async (data, createdBy) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const newUser = await prisma.user.create({
    data: {
      username: data.username,
      password: hashedPassword,
      is_active: true,
      role_id: data.role_id,
      category_id: data.category_id || null,
      name_mentri: data.name_mentri || null,
      contact_person: data.contact_person || null,
      filepath: data.filepath || null,
      original_name: data.original_name || null,
      created_by: createdBy,
    },
  });

  return newUser;
};

exports.updateUser = async (id, data, updatedBy) => {
  try {
    // Get existing user to check if there's an old file to delete
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { filepath: true }
    });

    if (!existingUser) {
      throw new Error("User not found");
    }

    // If new file is uploaded and there's an existing file, delete the old one
    if (data.filepath && existingUser.filepath && data.filepath !== existingUser.filepath) {
      try {
        await deleteFile(existingUser.filepath);
        console.log(`✅ Old user logo deleted from MinIO: ${existingUser.filepath}`);
      } catch (err) {
        console.error(`❌ Failed to delete old user logo from MinIO: ${existingUser.filepath}`, err);
      }
    }

    const updatePayload = {
      ...(data.username && { username: data.username }),
      ...(data.role_id && { role_id: data.role_id }),
      ...(data.category_id !== undefined && { category_id: data.category_id }),
      ...(data.name_mentri !== undefined && { name_mentri: data.name_mentri }),
      ...(data.contact_person !== undefined && {
        contact_person: data.contact_person,
      }),
      ...(data.filepath !== undefined && { filepath: data.filepath }),
      ...(data.original_name !== undefined && {
        original_name: data.original_name,
      }),
      updated_by: updatedBy,
    };

    return await prisma.user.update({
      where: { id },
      data: updatePayload,
    });
  } catch (error) {
    console.error("Error in updateUser:", error);
    throw error;
  }
};

exports.resetPasswordByAdmin = async (userId, newPassword, updatedBy) => {
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      updated_by: updatedBy,
    },
  });

  return updatedUser;
};

exports.changePasswordByUser = async (userId, oldPassword, newPassword) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) throw new Error("Old password is incorrect");

  const hashedNew = await bcrypt.hash(newPassword, 10);

  return await prisma.user.update({
    where: { id: userId },
    data: { password: hashedNew },
  });
};

// 🔎 Ambil user by ID
exports.findUserById = async (id) => {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      role: true,
      category: true,
    },
  });
};

exports.deleteUser = async (id, updatedBy) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new Error("User not found");
    }

    // Delete file from MinIO if exists
    if (user.filepath) {
      try {
        await deleteFile(user.filepath);
        console.log(`✅ User logo deleted from MinIO: ${user.filepath}`);
      } catch (err) {
        console.error(`❌ Failed to delete user logo from MinIO: ${user.filepath}`, err);
      }
    }

    return await prisma.user.update({
      where: { id },
      data: {
        is_active: false,
        username: `${user.username}_deleted_${Date.now()}`, // rename to avoid conflict
        filepath: null, // Clear filepath since file is deleted
        original_name: null, // Clear original_name as well
        updated_by: updatedBy,
      },
    });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    throw error;
  }
};
