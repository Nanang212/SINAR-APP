const userService = require("../services/userService");
const {
  successList,
  successCreate,
  successUpdate,
  successDelete,
  notFound,
  errorStatus,
} = require("../utils/response");

exports.getAllUsers = async (req, res) => {
  try {
    const data = await userService.findAllUsers();
    return successList(res, "Success getting all users", data);
  } catch (err) {
    console.error("GetAllUsers Error:", err);
    return errorStatus(res, 500, "Failed to get users");
  }
};

exports.getUserById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const user = await userService.findUserById(id);
    if (!user) return notFound(res, "User not found");
    return successList(res, "Success getting user by id", [user]);
  } catch (err) {
    console.error("GetUserById Error:", err);
    return errorStatus(res, 500, "Failed to get user by id");
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, password, role_id, category_id } = req.body;

    // Validasi: hanya admin (role_id === 1) yang boleh tanpa category
    if (role_id !== 1 && !category_id) {
      return errorStatus(res, 400, "Category is required for non-admin users");
    }

    const result = await userService.createUser({
      data: req.body,
      createdBy: req.user?.id || null,
    });

    return successCreate(res, "User created successfully", result);
  } catch (err) {
    console.error("CreateUser Error:", err);
    return errorStatus(res, 500, "Failed to create user");
  }
};

exports.updateUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // ⛔ Cegah update password lewat endpoint ini
    if ("password" in req.body) {
      return errorStatus(
        res,
        400,
        "Password cannot be updated through this endpoint"
      );
    }

    const { role_id, category_id } = req.body;

    if (role_id && role_id !== 1 && category_id === null) {
      return errorStatus(res, 400, "Category is required for non-admin users");
    }

    const result = await userService.updateUser(id, req.body, req.user?.id);
    return successUpdate(res, "User updated successfully", result);
  } catch (err) {
    console.error("UpdateUser Error:", err);
    return errorStatus(res, 500, "Failed to update user");
  }
};

exports.resetPasswordByAdmin = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { new_password } = req.body;

    if (!new_password) return errorStatus(res, 400, "New password is required");

    const result = await userService.resetPasswordByAdmin(
      userId,
      new_password,
      req.user?.id
    );
    return successUpdate(res, "Password reset successfully", result);
  } catch (err) {
    console.error("ResetPassword Error:", err);
    return errorStatus(res, 500, "Failed to reset password");
  }
};

exports.changePasswordByUser = async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password) {
      return errorStatus(res, 400, "Both old and new password are required");
    }

    const result = await userService.changePasswordByUser({
      userId: req.user.id,
      oldPassword: old_password,
      newPassword: new_password,
    });

    return successUpdate(res, "Password changed successfully", result);
  } catch (err) {
    console.error("ChangePassword Error:", err.message);
    return errorStatus(res, 400, err.message || "Failed to change password");
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    // Gunakan req.user.id (Integer), bukan req.user.name (String)
    const result = await userService.deleteUser(id, req.user?.id || null);

    if (!result.success) {
      if (result.code === 404) return notFound(res, result.msg);
      return errorStatus(res, 500, result.msg);
    }

    return successDelete(res, "User deleted successfully", result.data);
  } catch (err) {
    console.error("DeleteUser Error:", err);
    return errorStatus(res, 500, "Failed to delete user");
  }
};
