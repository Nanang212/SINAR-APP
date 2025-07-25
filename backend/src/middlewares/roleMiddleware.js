const roleMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    const userRole = req.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        status: false,
        code: 403,
        message: "Forbidden: You don't have access to this resource",
      });
    }

    next();
  };
};

module.exports = roleMiddleware;