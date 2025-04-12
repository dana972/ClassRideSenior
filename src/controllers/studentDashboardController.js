const client = require("../config/db");

const getStudentDashboard = async (req, res) => {
  try {
    const studentPhone = req.user.phone_number;
    console.log("Fetching student dashboard for:", studentPhone);

    // Get user info
    const userResult = await client.query('SELECT * FROM users WHERE phone_number = $1', [studentPhone]);
    if (userResult.rows.length === 0) {
      console.log("Student user not found");
      return res.status(404).send("Student not found");
    }

    const studentResult = await client.query('SELECT * FROM students WHERE phone_number = $1', [studentPhone]);
    if (studentResult.rows.length === 0) {
      console.log("Student data not found");
      return res.status(404).send("Student data not found");
    }

    const user = userResult.rows[0];
    const student = studentResult.rows[0];

    // ✅ Fetch conversations like in getDashboard
    const conversationsResult = await client.query(`
      SELECT 
        c.chat_id,
        c.participant_1_phone,
        c.participant_2_phone,
        u.full_name AS other_full_name
      FROM chats c
      JOIN users u 
        ON u.phone_number = CASE 
                              WHEN c.participant_1_phone = $1 THEN c.participant_2_phone 
                              ELSE c.participant_1_phone 
                            END
      WHERE c.participant_1_phone = $1 OR c.participant_2_phone = $1
    `, [studentPhone]);

    const conversations = conversationsResult.rows.map(row => ({
      id: row.chat_id,
      name: row.other_full_name
    }));

    // ✅ Render student dashboard
    res.render("studentDashboard", {
      userInfo: user,  
      location: student.location,
      schedule: student.schedule,
      attendance: student.attendance,
      user: req.user,
      studentInfo: student, // ⬅️ Add this line
      conversations,
      currentUserPhone: studentPhone
    });
    
  } catch (err) {
    console.error("Error loading student dashboard:", err);
    res.status(500).send("Error loading dashboard");
  }
};
const updateAttendance = async (req, res) => {
  const { attending } = req.body;
  const studentPhone = req.user.phone_number;

  try {
    await client.query(
      'UPDATE students SET attendance = $1 WHERE phone_number = $2',
      [attending, studentPhone] // this will be true or false
    );
    

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error updating attendance:", err);
    res.status(500).json({ success: false, message: "Failed to update attendance" });
  }
};
const updateStudentInfo = async (req, res) => {
  const studentPhone = req.user.phone_number;
  const { full_name, location, schedule } = req.body;

  try {
    // Update both tables: users (for name), students (for location/schedule)
    await client.query('UPDATE users SET full_name = $1 WHERE phone_number = $2', [full_name, studentPhone]);
    await client.query('UPDATE students SET location = $1, schedule = $2 WHERE phone_number = $3', [location, schedule, studentPhone]);

    res.json({ success: true });
  } catch (err) {
    console.error("Error updating student info:", err);
    res.status(500).json({ success: false, message: "Failed to update info" });
  }
};

module.exports = {
  getStudentDashboard,
  updateAttendance,
  updateStudentInfo
};

