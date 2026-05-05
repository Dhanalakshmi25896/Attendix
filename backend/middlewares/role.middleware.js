exports.isAdmin = (req, res, next) => {
  if (!req.user || !req.user.role) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user.role.toLowerCase() !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }

  next();
};

exports.isEmployee = (req, res, next) => {
  if (!req.user || !req.user.role) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user.role.toLowerCase() !== "employee") {
    return res.status(403).json({ message: "Employee access only" });
  }

  next();
};
