const kategoriService = require("../services/kategoriService");
const {
  successList,
  successCreate,
  successUpdate,
  successDelete,
  notFound,
  errorStatus,
} = require("../utils/response");

exports.getAllKategori = async (req, res) => {
  try {
    const result = await kategoriService.getAllKategori(req.query);
    return successList(res, "Success getting all kategori", result);
  } catch (err) {
    console.error("GetAllKategori Error:", err);
    return errorStatus(res, 500, "Failed to get kategori");
  }
};

exports.getKategoriById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await kategoriService.getKategoriById(id);
    if (!result) return notFound(res, "Kategori not found");
    return successList(res, "Success getting kategori by ID", [result]);
  } catch (err) {
    console.error("GetKategoriById Error:", err);
    return errorStatus(res, 500, "Failed to get kategori by ID");
  }
};

exports.createKategori = async (req, res) => {
  try {
    const result = await kategoriService.createKategori({
      data: req.body,
      createdBy: req.user?.id || null,
    });

    if (!result.success) {
      return errorStatus(res, result.code || 500, result.msg);
    }

    return successCreate(
      res,
      result.message || "Kategori created",
      result.data
    );
  } catch (err) {
    console.error("CreateKategori Error:", err);
    return errorStatus(res, 500, "Failed to create kategori");
  }
};

exports.updateKategori = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await kategoriService.updateKategori(
      id,
      req.body,
      req.user?.id
    );

    if (!result.success) {
      if (result.code === 404) return notFound(res, result.msg);
      return errorStatus(res, result.code || 500, result.msg);
    }

    return successUpdate(
      res,
      result.message || "Kategori updated",
      result.data
    );
  } catch (err) {
    console.error("UpdateKategori Error:", err);
    return errorStatus(res, 500, "Failed to update kategori");
  }
};

exports.deleteKategori = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await kategoriService.deleteKategori(
      id,
      req.user?.id || null
    );

    if (!result.success) {
      if (result.code === 404) return notFound(res, result.msg);
      return errorStatus(res, result.code || 500, result.msg);
    }

    return successDelete(
      res,
      result.message || "Kategori deleted",
      result.data
    );
  } catch (err) {
    console.error("DeleteKategori Error:", err);
    return errorStatus(res, 500, "Failed to delete kategori");
  }
};
