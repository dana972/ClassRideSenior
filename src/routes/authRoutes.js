const express = require("express");
const authController = require("../controllers/authController");
const router = express.Router();

// Signup Route
router.post("/signup", authController.signup);

// Login Route
router.post("/login", authController.login);

// Logout Route
router.post("/logout", authController.logout);

// Check if authenticated (for frontend dashboard logic)
router.get("/check-auth", authController.checkAuth);

// Protected Route Example
router.get("/protected", authController.verifyToken, authController.protectedRoute);

module.exports = router;
