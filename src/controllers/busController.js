// src/controllers/busOwnerController.js
const pool = require('../config/db');

// Add new bus function
const addBus = async (req, res) => {
  const { busId, ownerPhone, busName, capacity } = req.body;

  if (!busId || !ownerPhone || !busName || !capacity) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO buses (bus_id, owner_phone, bus_name, capacity) VALUES ($1, $2, $3, $4) RETURNING *',
      [busId, ownerPhone, busName, capacity]
    );
    
    res.status(201).json({ message: 'Bus added successfully', bus: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding bus', error: error.message });
  }
};

module.exports = {
  addBus,
};
