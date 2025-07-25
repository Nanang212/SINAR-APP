const kategoriRepository = require("../repositories/kategoriRepository");

exports.getAllKategori = async (params) => {
  return await kategoriRepository.findAllKategori(params);
};

exports.getKategoriById = async (id) => {
  return await kategoriRepository.findKategoriById(id);
};

exports.createKategori = async ({ data, createdBy }) => {
  return await kategoriRepository.createKategori({ data, createdBy });
};

exports.updateKategori = async (id, data, updatedBy) => {
  return await kategoriRepository.updateKategori(id, data, updatedBy);
};

exports.deleteKategori = async (id, updatedBy) => {
  return await kategoriRepository.deleteKategori(id, updatedBy);
};
