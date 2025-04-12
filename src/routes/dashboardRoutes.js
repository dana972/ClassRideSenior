const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/authMiddleware");
const { getDashboardrole } = require("../controllers/dashboardController");

// Role-based dashboard route
router.get("/:role/dashboard", verifyToken, (req, res) => {
    const userRole = req.user.role;
  
    // Redirect student to their actual dashboard route
    if (userRole === "student") {
      return res.redirect("/student/dashboard");
    }
  
    const allowedRoles = ["owner", "driver", "pending"];
    if (!allowedRoles.includes(userRole) || req.params.role !== userRole) {
      return res.status(403).json({ message: "Unauthorized" });
    }
  
    return getDashboardrole(req, res);
  });
  
module.exports = router;
