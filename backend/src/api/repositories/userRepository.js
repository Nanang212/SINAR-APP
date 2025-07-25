const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");

exports.createUser = async (data, createdBy) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const newUser = await prisma.user.create({
    data: {
      username: data.username,
      password: hashedPassword,
      is_active: true,
      role_id: data.role_id,
      category_id: data.category_id || null,
      created_by: createdBy,
    },
  });

  return newUser;
};

exports.updateUser = async (id, data, updatedBy) => {
  const updatePayload = {
    ...(data.username && { username: data.username }),
    ...(data.role_id && { role_id: data.role_id }),
    ...(data.category_id !== undefined && { category_id: data.category_id }),
    updated_by: updatedBy,
  };

  return await prisma.user.update({
    where: { id },
    data: updatePayload,
  });
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

exports.findAllUsers = async () => {
  return await prisma.user.findMany({
    include: {
      role: true,
      category: true,
    },
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
  const user = await prisma.user.findUnique({ where: { id } });

  return await prisma.user.update({
    where: { id },
    data: {
      is_active: false,
      username: `${user.username}_deleted_${Date.now()}`, // rename to avoid conflict
      updated_by: updatedBy,
    },
  });
};
