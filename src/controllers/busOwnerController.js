const client = require('../config/db'); // Import the database client

// Function to fetch dashboard data
const getDashboard = async (req, res) => {
  try {
    const ownerPhone = req.user.phone_number;

    console.log("Fetching dashboard for:", ownerPhone);

    const ownerResult = await client.query('SELECT * FROM users WHERE phone_number = $1', [ownerPhone]);

    if (ownerResult.rows.length === 0) {
      console.log("Owner not found in database");
      return res.status(404).send("Owner not found");
    }

    const ownerName = ownerResult.rows[0].full_name;

    const busesResult = await client.query('SELECT * FROM buses WHERE owner_phone = $1', [ownerPhone]);

    const driversResult = await client.query(`
      SELECT drivers.phone_number, users.full_name, drivers.location
      FROM drivers
      JOIN users ON drivers.phone_number = users.phone_number
      WHERE drivers.owner_phone = $1
    `, [ownerPhone]);

    const studentsCountResult = await client.query('SELECT COUNT(*) FROM students WHERE owner_phone = $1', [ownerPhone]);

    const studentsListResult = await client.query(`
      SELECT users.full_name, users.phone_number, students.location, students.schedule, students.attendance
      FROM students
      JOIN users ON students.phone_number = users.phone_number
      WHERE students.owner_phone = $1
    `, [ownerPhone]);

    const joinRequestsResult = await client.query(
      `SELECT COUNT(*) FROM students_join_requests 
       WHERE owner_phone = $1 AND status = 'pending'`, 
       [ownerPhone]
    );
    
    const destinationsResult = await client.query('SELECT * FROM destinations WHERE owner_phone = $1', [ownerPhone]);
// Fetch conversations for the chat interface.
// This query gets each chat where the owner is a participant
// and joins with the users table to retrieve the other participant's full name.
const conversationsResult = await client.query(
  `
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
  `,
  [ownerPhone]
);
const conversations = conversationsResult.rows.map(row => ({
  id: row.chat_id,
  name: row.other_full_name
}));res.render('busOwnerDashboard', {
  ownerName,
  buses: busesResult.rows,
  drivers: driversResult.rows,
  students: studentsListResult.rows,
  studentsCount: studentsCountResult.rows[0].count,
  joinRequestsCount: joinRequestsResult.rows[0].count,
  destinations: destinationsResult.rows,
  user: req.user, // already present for other uses
  conversations, // added for chat functionality
  currentUserPhone: ownerPhone // for chats.ejs to use
});

  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    res.status(500).send("Error loading dashboard");
  }
};
// ✅ GET all buses for this owner
const getAllBuses = async (req, res) => {
  const ownerPhone = req.user.phone_number;
  try {
    const result = await client.query(
      'SELECT * FROM buses WHERE owner_phone = $1',
      [ownerPhone]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching buses:", err);
    res.status(500).json({ error: "Failed to fetch buses" });
  }
};

// ✅ GET all drivers for this owner
const getAllDrivers = async (req, res) => {
  const ownerPhone = req.user.phone_number;
  try {
    const result = await client.query(
      `SELECT drivers.phone_number, users.full_name
       FROM drivers
       JOIN users ON drivers.phone_number = users.phone_number
       WHERE drivers.owner_phone = $1`,
      [ownerPhone]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching drivers:", err);
    res.status(500).json({ error: "Failed to fetch drivers" });
  }
};

// ✅ GET all destinations for this owner
const getAllDestinations = async (req, res) => {
  const ownerPhone = req.user.phone_number;
  try {
    const result = await client.query(
      'SELECT * FROM destinations WHERE owner_phone = $1',
      [ownerPhone]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching destinations:", err);
    res.status(500).json({ error: "Failed to fetch destinations" });
  }
};

// Function to remove a bus
const removeBus = async (req, res) => {
  const { id } = req.params;
  const ownerPhone = req.user.phone_number;

  try {
    const result = await client.query(
      'DELETE FROM buses WHERE bus_id = $1 AND owner_phone = $2',
      [id, ownerPhone]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Bus not found or not authorized' });
    }

    res.status(200).json({ message: 'Bus removed successfully' });
  } catch (err) {
    console.error("Error removing bus:", err);
    res.status(500).json({ error: 'Failed to remove bus' });
  }
};

// Function to remove a destination
const removeDestination = async (req, res) => {
  const { id } = req.params;
  const ownerPhone = req.user.phone_number;

  try {
    const result = await client.query(
      'DELETE FROM destinations WHERE destination_id = $1 AND owner_phone = $2',
      [id, ownerPhone]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Destination not found or not authorized' });
    }

    res.status(200).json({ message: 'Destination removed successfully' });
  } catch (err) {
    console.error("Error removing destination:", err);
    res.status(500).json({ error: 'Failed to remove destination' });
  }
};

// Function to remove a driver
const removeDriver = async (req, res) => {
  const { id } = req.params;
  const ownerPhone = req.user.phone_number;

  try {
    const result = await client.query(
      'DELETE FROM drivers WHERE phone_number = $1 AND owner_phone = $2',
      [id, ownerPhone]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Driver not found or not authorized' });
    }

    res.status(200).json({ message: 'Driver removed successfully' });
  } catch (err) {
    console.error("Error removing driver:", err);
    res.status(500).json({ error: 'Failed to remove driver' });
  }
};

// ✅ Function to remove a student
const removeStudent = async (req, res) => {
  const { id } = req.params;
  const ownerPhone = req.user.phone_number;

  try {
    const result = await client.query(
      'DELETE FROM students WHERE phone_number = $1 AND owner_phone = $2',
      [id, ownerPhone]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Student not found or not authorized' });
    }

    res.status(200).json({ message: 'Student removed successfully' });
  } catch (err) {
    console.error("Error removing student:", err);
    res.status(500).json({ error: 'Failed to remove student' });
  }
};

// Function to add a bus
const addBus = async (req, res) => {
  const ownerPhone = req.user.phone_number;
  const { busName, capacity } = req.body;

  try {
    await client.query(
      'INSERT INTO buses (bus_name, capacity, owner_phone) VALUES ($1, $2, $3)',
      [busName, capacity, ownerPhone]
    );

    res.status(201).json({ message: 'Bus added successfully' });
  } catch (err) {
    console.error('Error adding bus:', err);
    res.status(500).json({ error: 'Failed to add bus' });
  }
};

// Function to add a destination
const addDestination = async (req, res) => {
  const ownerPhone = req.user.phone_number;
  const { destinationName, location } = req.body;

  try {
    await client.query(
      'INSERT INTO destinations (name, location, owner_phone) VALUES ($1, $2, $3)',
      [destinationName, location, ownerPhone]
    );

    res.status(201).json({ message: 'Destination added successfully' });
  } catch (err) {
    console.error('Error adding destination:', err);
    res.status(500).json({ error: 'Failed to add destination' });
  }
};
const createTrip = async (req, res) => {
  const { bus_id, driver_phone, destination_id, pickup_time, dropoff_time, type } = req.body;

  // Build schedule from pickup_time and tomorrow's date
  const scheduleDate = new Date();
  scheduleDate.setDate(scheduleDate.getDate() + 1);
  const [hours, minutes] = pickup_time.split(':');
  scheduleDate.setHours(hours, minutes, 0, 0);
  const schedule = scheduleDate.toISOString();

  try {
    await client.query(
      `INSERT INTO trips (
        bus_id, driver_phone, destination_id, pickup_time, dropoff_time, date, type, status, schedule
      ) VALUES (
        $1, $2, $3, $4, $5, CURRENT_DATE + INTERVAL '1 day', $6, 'scheduled', $7
      )`,
      [bus_id, driver_phone, destination_id, pickup_time, dropoff_time, type, schedule]
    );

    res.status(201).json({ message: 'Trip created successfully' });
  } catch (err) {
    console.error('Error creating trip:', err);
    res.status(500).json({ error: 'Failed to create trip' });
  }
};
const getStudentsByDestination = async (req, res) => {
  const ownerPhone = req.user.phone_number;

  try {
    const result = await client.query(`
      SELECT 
        s.phone_number,
        s.location,
        s.schedule,
        s.attendance,
        u.full_name,
        d.destination_id,
        d.name AS destination_name
      FROM students s
      JOIN users u ON s.phone_number = u.phone_number
      JOIN destinations d ON s.destination_id = d.destination_id
      WHERE s.owner_phone = $1
      AND s.attendance = true
      AND NOT EXISTS (
        SELECT 1 FROM students_assignment sa
        WHERE sa.student_phone = s.phone_number
      )
      ORDER BY d.name, u.full_name;
    `, [ownerPhone]);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching students by destination:", err);
    res.status(500).json({ error: "Failed to fetch students" });
  }
};

// ✅ Get all trips for current owner (for trip cards)
const getAllTrips = async (req, res) => {
  const ownerPhone = req.user.phone_number;

  try {
    const result = await client.query(`
      SELECT 
        t.trip_id, t.bus_id, t.driver_phone, t.destination_id,
        t.pickup_time, t.dropoff_time, t.type, t.date, d.name AS destination_name
      FROM trips t
      JOIN destinations d ON t.destination_id = d.destination_id
      WHERE d.owner_phone = $1
      ORDER BY t.date DESC, t.pickup_time ASC
    `, [ownerPhone]);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching trips:", err);
    res.status(500).json({ error: "Failed to fetch trips" });
  }
};

// ✅ Get trip details by ID + list of assigned students
// ✅ Get trip details by ID + list of assigned students
const getTripDetails = async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch trip info with driver and destination details
    const tripResult = await client.query(`
      SELECT 
        t.*, 
        d.name AS destination_name, 
        u.full_name AS driver_name
      FROM trips t
      JOIN destinations d ON t.destination_id = d.destination_id
      JOIN users u ON t.driver_phone = u.phone_number
      WHERE t.trip_id = $1
    `, [id]);

    if (tripResult.rows.length === 0) {
      return res.status(404).json({ error: "Trip not found" });
    }

    const trip = tripResult.rows[0];

    // Fetch assigned students with full info
    const studentsResult = await client.query(`
      SELECT u.full_name, s.phone_number, s.location, s.schedule, s.attendance
      FROM students_assignment sa
      JOIN students s ON sa.student_phone = s.phone_number
      JOIN users u ON s.phone_number = u.phone_number
      WHERE sa.trip_id = $1
    `, [id]);

    res.status(200).json({
      trip,
      students: studentsResult.rows
    });
  } catch (err) {
    console.error("Error fetching trip details:", err);
    res.status(500).json({ error: "Failed to fetch trip details" });
  }
};

const updateTrip = async (req, res) => {
  const { id } = req.params;
  const { bus_id, driver_phone, destination_id, pickup_time, dropoff_time, type } = req.body;

  try {
    await client.query(
      `
      UPDATE trips
      SET 
        bus_id = $1,
        driver_phone = $2,
        destination_id = $3,
        pickup_time = $4,
        dropoff_time = $5,
        type = $6
      WHERE trip_id = $7
      `,
      [bus_id, driver_phone, destination_id, pickup_time, dropoff_time, type, id]
    );

    res.status(200).json({ message: "Trip updated successfully" });
  } catch (err) {
    console.error("Error updating trip:", err);
    res.status(500).json({ error: "Failed to update trip" });
  }
};


const assignStudentToTrip = async (req, res) => {
  const { student_phone, trip_id } = req.body;

  try {
    await client.query(
      `INSERT INTO students_assignment (student_phone, trip_id) VALUES ($1, $2)`,
      [student_phone, trip_id]
    );

    res.status(201).json({ message: 'Student assigned to trip successfully' });
  } catch (err) {
    console.error("Error assigning student to trip:", err);
    res.status(500).json({ error: "Failed to assign student to trip" });
  }
};
const unassignStudentFromTrip = async (req, res) => {
  const { student_phone, trip_id } = req.body;

  try {
    await client.query(
      'DELETE FROM students_assignment WHERE student_phone = $1 AND trip_id = $2',
      [student_phone, trip_id]
    );

    res.status(200).json({ message: 'Student unassigned successfully' });
  } catch (err) {
    console.error("Error unassigning student from trip:", err);
    res.status(500).json({ error: "Failed to unassign student" });
  }
};
const getJoinRequests = async (req, res) => {
  const ownerPhone = req.user.phone_number;
  console.log("📥 Fetching join requests for owner:", ownerPhone);

  try {
    const result = await client.query(`
      SELECT 
        r.req_id,
        u.full_name,
        u.phone_number,
        r.status
      FROM students_join_requests r
      JOIN users u ON r.student_phone = u.phone_number
      WHERE r.owner_phone = $1 AND r.status = 'pending'
    `, [ownerPhone]);

    console.log("🎯 Join requests found:", result.rows);

    res.status(200).json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching join requests:", err);
    res.status(500).json({ error: "Failed to fetch join requests" });
  }
};
const acceptJoinRequest = async (req, res) => {
  const { studentPhone } = req.body;
  const ownerPhone = req.user.phone_number;

  try {
    // 1. Update the user's role
    await client.query(`
      UPDATE users
      SET role = 'student'
      WHERE phone_number = $1
    `, [studentPhone]);

    // 2. Insert student with default destination_id = 1
    await client.query(`
      INSERT INTO students (
        phone_number, destination_id, schedule, location, attendance, owner_phone
      )
      VALUES ($1, 1, '08:00 AM', 'Main Gate', false, $2)
      ON CONFLICT (phone_number) DO NOTHING
    `, [studentPhone, ownerPhone]);

    // 3. Update join request status
    await client.query(`
      UPDATE students_join_requests
      SET status = 'accepted'
      WHERE student_phone = $1 AND owner_phone = $2
    `, [studentPhone, ownerPhone]);

    res.status(200).json({ message: "Student accepted successfully" });
  } catch (err) {
    console.error("❌ Error accepting student:", err);
    res.status(500).json({ error: "Failed to accept student" });
  }
};

module.exports = {
  getDashboard,
  getAllBuses,
  getAllDrivers,
  getAllDestinations,
  removeBus,
  removeDestination,
  removeDriver,
  removeStudent,
  addBus,
  addDestination,
  createTrip,
  getStudentsByDestination,
  getAllTrips,  
         // ✅ export added
  getTripDetails ,
  updateTrip ,
  assignStudentToTrip  ,    // ✅ export added
  unassignStudentFromTrip,
  getJoinRequests,
  acceptJoinRequest
};
