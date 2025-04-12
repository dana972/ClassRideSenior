const express = require("express");
const router = express.Router();
const authenticateUser = require("../middlewares/authMiddleware");
const { getStudentDashboard,updateAttendance,updateStudentInfo  } = require("../controllers/studentDashboardController");

router.get("/dashboard", authenticateUser, getStudentDashboard);
router.post('/update-attendance',  updateAttendance);
router.post("/update-info",  updateStudentInfo);

module.exports = router;
