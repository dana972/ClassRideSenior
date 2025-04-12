const express = require('express');
const router = express.Router();

const {
  getDashboard,
  removeBus,
  removeDestination,
  removeDriver,
  removeStudent,
  addBus,
  addDestination,
  createTrip,
  getStudentsByDestination,
  getAllTrips,
  getTripDetails,
  updateTrip,
  assignStudentToTrip,
  unassignStudentFromTrip,
  getAllBuses,
  getAllDrivers,
  getAllDestinations,
  getJoinRequests,
  acceptJoinRequest
} = require('../controllers/busOwnerController');

// ===================
// GET routes
// ===================

router.get('/dashboard', getDashboard);
router.get('/dashboard/trips', getAllTrips);
router.get('/dashboard/trip/:id', getTripDetails);
router.get('/dashboard/students-by-destination', getStudentsByDestination);
router.get('/dashboard/buses', getAllBuses);
router.get('/dashboard/drivers', getAllDrivers);
router.get('/dashboard/destinations', getAllDestinations
);
router.get('/dashboard/join-requests', getJoinRequests);
router.post("/dashboard/join-requests/accept", acceptJoinRequest);


// ===================
// POST routes
// ===================

router.post('/dashboard/bus', addBus);
router.post('/dashboard/destination', addDestination);
router.post('/dashboard/trip', createTrip);
router.post('/dashboard/assign-student', assignStudentToTrip);
router.post('/dashboard/unassign-student', unassignStudentFromTrip);

// ===================
// PUT route
// ===================

router.put('/dashboard/trip/:id', updateTrip); // ✅ Update trip info

// ===================
// DELETE routes
// ===================

router.delete('/dashboard/bus/:id', removeBus);
router.delete('/dashboard/destination/:id', removeDestination);
router.delete('/dashboard/driver/:id', removeDriver);
router.delete('/dashboard/student/:id', removeStudent);

module.exports = router;
