const db = require("../config/db");

exports.showApplicationForm = async (req, res) => {
    try {
      const result = await db.query(
        'SELECT full_name FROM users WHERE phone_number = $1',
        [req.user.phone_number]
      );
  
      const fullName = result.rows.length > 0 ? result.rows[0].full_name : "";
  
      res.render("beOwner", {
        user: {
          full_name: fullName,
          phone_number: req.user.phone_number,
        },
        successMessage: null // ✅ important to define this
      });
    } catch (err) {
      console.error("Error fetching user:", err);
      res.status(500).send("Internal Server Error");
    }
  };
  
exports.submitApplication = async (req, res) => {
    const { boardNumber } = req.body;
    const busLogo = req.file?.filename;
    const phone = req.user.phone_number;
  
    if (!boardNumber || !busLogo) {
      return res.status(400).send("Missing required fields.");
    }
  
    try {
      const result = await db.query(
        'SELECT full_name FROM users WHERE phone_number = $1',
        [phone]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).send("User not found");
      }
  
      const fullName = result.rows[0].full_name;
  
      await db.query(
        `INSERT INTO owners_join_requests 
        (phone_number, full_name, board_number, bus_logo, status, created_at)
        VALUES ($1, $2, $3, $4, 'pending', NOW())`,
        [phone, fullName, boardNumber, busLogo]
      );
  
      // ✅ Render the same page with a success alert
      res.render("beOwner", {
        user: { phone_number: phone, full_name: fullName },
        successMessage: "Application submitted successfully! Wait for admin approval."
      });
  
    } catch (err) {
      console.error("❌ Error submitting application:", err);
      res.status(500).send("Something went wrong.");
    }
  };
  