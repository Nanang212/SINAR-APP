// ======= SUCCESS RESPONSES =======

exports.successList = (res, message, data = []) => {
  if (Array.isArray(data)) {
    // Format lama: hanya array
    res.status(200).json({
      status: true,
      code: 200,
      message,
      total: data.length,
      data,
    });
  } else {
    // Format baru: object { total, page, limit, data }
    res.status(200).json({
      status: true,
      code: 200,
      message,
      total: data.total || 0,
      page: data.page || 1,
      // limit: data.limit || 0,
      data: data.data || [],
    });
  }
};

exports.successCreate = (res, message, data) => {
  res.status(201).json({
    status: true,
    code: 201,
    message,
    data,
  });
};

exports.successUpdate = (res, message, data) => {
  res.status(200).json({
    status: true,
    code: 200,
    message,
    data,
  });
};

exports.successDelete = (res, message) => {
  res.status(200).json({
    status: true,
    code: 200,
    message,
  });
};

// ======= ERROR RESPONSES =======

// Generic error
exports.error = (res, message = "Internal server error", status = 500) => {
  res.status(status).json({
    status: false,
    code: status,
    message,
  });
};

// Error with custom status
exports.errorStatus = (res, status = 500, message = "Something went wrong") => {
  res.status(status).json({
    status: false,
    code: status,
    message,
  });
};

// Specific errors
exports.errorDataExist = (res, message = "Data already exists") => {
  res.status(409).json({
    status: false,
    code: 409,
    message,
  });
};

exports.unauthorized = (res, message = "Unauthorized access") => {
  res.status(401).json({
    status: false,
    code: 401,
    message,
  });
};

exports.forbidden = (res, message = "Forbidden access") => {
  res.status(403).json({
    status: false,
    code: 403,
    message,
  });
};

exports.notFound = (res, message = "Resource not found") => {
  res.status(404).json({
    status: false,
    code: 404,
    message,
  });
};

exports.tooManyRequests = (
  res,
  message = "Too many requests, please try again later"
) => {
  res.status(429).json({
    status: false,
    code: 429,
    message,
  });
};
