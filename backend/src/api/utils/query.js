const defaultSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  is_active: true,
};

exports.findAllBuilder = async ({ model, params, customSelect }) => {
  const {
    page = 1,
    limit = 100,
    orderBy = "id",
    order = "asc",
    where = {},
  } = params;

  const take = parseInt(limit, 10);
  const skip = (parseInt(page, 10) - 1) * take;

  // Hitung total data tanpa pagination
  const total = await model.count({ where });

  // Ambil data dengan pagination
  const data = await model.findMany({
    skip,
    take,
    orderBy: {
      [orderBy]: order.toLowerCase() === "desc" ? "desc" : "asc",
    },
    where,
    select: customSelect || defaultSelect,
  });

  return {
    total,
    page: parseInt(page, 10),
    limit: take,
    data,
  };
};
