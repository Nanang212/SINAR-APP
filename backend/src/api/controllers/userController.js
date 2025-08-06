const userService = require("../services/userService");
const {
  successList,
  successCreate,
  successUpdate,
  successDelete,
  notFound,
  errorStatus,
} = require("../utils/response");
const { baseUrl } = require("../../config/dotenv");

exports.getAllUsers = async (req, res) => {
  try {
    const result = await userService.findAllUsers(req.query);

    let filtered = result.data;

    const formattedData = filtered.map((user) => ({
      id: user.id,
      username: user.username,
      name_mentri: user.name_mentri,
      contact_person: user.contact_person,
      filepath: user.filepath,
      original_name: user.original_name,
      logo_url: user.filepath ? `${baseUrl}/api/v1/admin/users/preview/${user.id}` : null,
      created_at: user.created_at,
      updated_at: user.updated_at,
      created_by: user.created_by,
      updated_by: user.updated_by,
      is_active: user.is_active,
      role: user.role ? { id: user.role.id, name: user.role.name } : null,
      category: user.category
        ? { id: user.category.id, name: user.category.name }
        : null,
    }));

    return successList(res, "Success getting all users", {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasNext: result.hasNext,
      hasPrev: result.hasPrev,
      data: formattedData,
    });
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

    // Format data agar sama dengan getAllUsers
    const formattedUser = {
      id: user.id,
      username: user.username,
      name_mentri: user.name_mentri,
      contact_person: user.contact_person,
      filepath: user.filepath,
      original_name: user.original_name,
      logo_url: user.filepath ? `${baseUrl}/api/v1/admin/users/preview/${user.id}` : null,
      created_at: user.created_at,
      updated_at: user.updated_at,
      created_by: user.created_by,
      updated_by: user.updated_by,
      is_active: user.is_active,
      role: user.role ? { id: user.role.id, name: user.role.name } : null,
      category: user.category
        ? { id: user.category.id, name: user.category.name }
        : null,
    };

    return successList(res, "Success getting user by id", [formattedUser]); // ⬅️ Tetap array
  } catch (err) {
    console.error("GetUserById Error:", err);
    return errorStatus(res, 500, "Failed to get user by id");
  }
};

exports.createUser = async (req, res) => {
  try {
    // Ambil data dari body
    const username = req.body.username;
    const password = req.body.password;
    const role_id = req.body.role_id ? parseInt(req.body.role_id) : null;
    const category_id = req.body.category_id
      ? parseInt(req.body.category_id)
      : null;

    // Validasi: hanya admin (role_id === 1) yang boleh tanpa category
    if (role_id !== 1 && !category_id) {
      return errorStatus(res, 400, "Category is required for non-admin users");
    }

    // Handle file upload untuk logo
    let logoData = {};
    if (req.file) {
      logoData = {
        filepath: req.file.path,
        original_name: req.file.originalname,
      };
    }

    const result = await userService.createUser(
      {
        username,
        password,
        role_id,
        category_id,
        name_mentri: req.body.name_mentri,
        contact_person: req.body.contact_person,
        filepath: logoData.filepath,
        original_name: logoData.original_name,
      },
      req.user?.id || null
    );

    return successCreate(res, "User created successfully", result);
  } catch (err) {
    console.error("CreateUser Error:", err);
    return errorStatus(res, 500, "Failed to create user");
  }
};

exports.updateUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Cegah update password lewat endpoint ini
    if ("password" in req.body) {
      return errorStatus(
        res,
        400,
        "Password cannot be updated through this endpoint"
      );
    }

    // Force parseInt role_id & category_id jika ada
    const role_id = req.body.role_id ? parseInt(req.body.role_id) : undefined;
    const category_id =
      req.body.category_id !== undefined && req.body.category_id !== null
        ? parseInt(req.body.category_id)
        : null;

    if (role_id && role_id !== 1 && category_id === null) {
      return errorStatus(res, 400, "Category is required for non-admin users");
    }

    // Handle file upload untuk logo update
    let logoData = {};
    if (req.file) {
      logoData = {
        filepath: req.file.path,
        original_name: req.file.originalname,
      };
    }

    const result = await userService.updateUser(
      id,
      {
        ...req.body,
        role_id,
        category_id,
        ...logoData,
      },
      req.user?.id
    );

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

exports.previewUserLogo = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await userService.previewUserLogo({ id, req, res });
    // streaming handled directly by service via helper
  } catch (err) {
    console.error("PreviewUserLogo Error:", err);
    const code = err.code || 500;
    const message = err.message || "Failed to preview user logo";

    return res.status(code).json({
      status: false,
      code,
      message,
    });
  }
};
