const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // ✅ Attach user info (id, role, etc.)
    next(); // ✅ Let the route decide what to do with the role
  } catch (err) {
    res.status(403).json({ error: "Invalid token" });
  }
};
