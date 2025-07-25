const userRepository = require("../repositories/userRepository");

exports.createUser = async ({ data, createdBy }) => {
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

exports.findAllUsers = async () => {
  return await userRepository.findAllUsers();
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
