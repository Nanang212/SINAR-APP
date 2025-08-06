const userRepository = require("../repositories/userRepository");
const { streamUserLogo } = require("../utils/minioHelper");

exports.findAllUsers = async (params) => {
  const result = await userRepository.findAllUsers(params);
  // console.log("FindAllUsers Result", result); // Debugging log
  return result;
};

exports.createUser = async (data, createdBy) => {
  return await userRepository.createUser(data, createdBy);
};

exports.updateUser = async (id, data, updatedBy) => {
  return await userRepository.updateUser(id, data, updatedBy);
};

exports.resetPasswordByAdmin = async (userId, newPassword, updatedBy) => {
  return await userRepository.resetPasswordByAdmin(
    userId,
    newPassword,
    updatedBy
  );
};

exports.changePasswordByUser = async ({ userId, oldPassword, newPassword }) => {
  return await userRepository.changePasswordByUser(
    userId,
    oldPassword,
    newPassword
  );
};

exports.findUserById = async (id) => {
  return await userRepository.findUserById(id);
};

exports.deleteUser = async (id, updatedBy) => {
  const user = await userRepository.findUserById(id);
  if (!user || !user.is_active) {
    return {
      success: false,
      code: 404,
      msg: "User not found or already inactive",
    };
  }

  const deleted = await userRepository.deleteUser(id, updatedBy);
  return { success: true, data: deleted };
};

exports.previewUserLogo = async ({ id, req, res }) => {
  const user = await userRepository.findUserById(id);

  if (!user || !user.is_active) {
    throw { code: 404, message: "User not found or inactive" };
  }

  if (!user.filepath) {
    throw { code: 404, message: "User logo not found" };
  }

  // Stream the user logo file
  await streamUserLogo(user.filepath, req, res);
};
