const defaultSelect = {
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  is_active: true,
};

exports.findAllBuilder = async ({ model, params, customSelect, searchFields = ['name'] }) => {
  const {
    page = 1,
    limit = 100,
    orderBy = "id",
    order = "asc",
    search = "",
    where = {},
  } = params;
  
  const take = parseInt(limit, 10);
  const skip = (parseInt(page, 10) - 1) * take;
  
  // Build where clause with search functionality
  let whereClause = { ...where };
  
  if (search && search.trim() !== "") {
    const searchConditions = searchFields.map(field => ({
      [field]: {
        contains: search.trim(),
        mode: 'insensitive'
      }
    }));
    
    whereClause = {
      ...whereClause,
      OR: searchConditions
    };
  }

  // Hitung total data tanpa pagination
  const total = await model.count({ where: whereClause });

  // Ambil data dengan pagination
  const data = await model.findMany({
    skip,
    take,
    orderBy: {
      [orderBy]: order.toLowerCase() === "desc" ? "desc" : "asc",
    },
    where: whereClause,
    select: customSelect || defaultSelect,
  });

  return {
    total,
    page: parseInt(page, 10),
    limit: take,
    data,
    totalPages: Math.ceil(total / take),
    hasNext: skip + take < total,
    hasPrev: parseInt(page, 10) > 1
  };
};
