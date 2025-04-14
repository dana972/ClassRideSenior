const db = require("../config/db");
const { isNearby } = require('../utils/haversine');
const haversine = require('haversine-distance');

const findMatchingBusOwners = async (studentLocation, university) => {
  console.log('🧭 Student location:', studentLocation);
  console.log('🎓 Destination requested:', university);

  // Step 1: Get destination IDs matching the user input
  const destRes = await db.query(`
    SELECT destination_id FROM destinations
    WHERE LOWER(name) LIKE LOWER($1)
  `, [`%${university}%`]);

  if (!destRes.rows.length) {
    console.log("❌ No destination found matching:", university);
    return [];
  }

  const destinationIds = destRes.rows.map(row => row.destination_id);

  // Step 2: Get owners with routes to those destinations
  const ownersRes = await db.query(`
    SELECT DISTINCT u.phone_number, u.full_name, u.role
    FROM routes r
    JOIN users u ON r.owner_phone = u.phone_number
    WHERE r.destination_id = ANY($1::int[])
      AND u.role = 'owner'
  `, [destinationIds]);

  if (!ownersRes.rows.length) {
    console.log("❌ No owners found for destinations:", destinationIds);
    return [];
  }

  const owners = ownersRes.rows;

  // Step 3: Get all relevant route points
  const routePointsRes = await db.query(`
    SELECT rp.*, r.destination_id, r.id AS route_id, r.owner_phone
    FROM route_points rp
    JOIN routes r ON rp.route_id = r.id
    WHERE r.owner_phone = ANY($1::text[])
      AND r.destination_id = ANY($2::int[])
  `, [owners.map(o => o.phone_number), destinationIds]);

  const routePoints = routePointsRes.rows;
  const matchedOwnerPhones = new Set();

  // Step 4: Compare distance from student's location
  routePoints.forEach(point => {
    const pointLocation = { latitude: point.latitude, longitude: point.longitude };
    const distance = haversine(studentLocation, pointLocation);

    console.log(`📍 Distance to "${point.stop_name}": ${distance.toFixed(2)} meters`);

    if (isNearby(studentLocation, pointLocation, 8000)) { // 🔧 adjust distance here
      matchedOwnerPhones.add(point.owner_phone);
    }
  });

  // Step 5: Filter and return matched owners
  const matchedOwners = owners.filter(owner => matchedOwnerPhones.has(owner.phone_number));

  console.log(`✅ Found ${matchedOwners.length} matching owner(s) near student location`);
  return matchedOwners;
};

module.exports = { findMatchingBusOwners };
