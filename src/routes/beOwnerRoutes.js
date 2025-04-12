const express = require("express");
const router = express.Router();
const beOwnerController = require("../controllers/beOwnerController");
const multer = require("multer");
const path = require("path");

// Set up Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/bus-logos"); // Ensure this folder exists
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({ storage });

// GET form (optional)
router.get("/beOwner", beOwnerController.showApplicationForm);

// POST form submission
router.post("/beOwner", upload.single("busLogo"), beOwnerController.submitApplication);

module.exports = router;
