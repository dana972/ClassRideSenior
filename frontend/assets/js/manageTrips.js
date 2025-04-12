// 🔁 Modal toggle helper
function toggleModal(id, show = true) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = show ? 'flex' : 'none';
}

// ✅ Show student info and enable "Chat Now"
function showStudentInfo({ full_name, phone_number, location, schedule, attendance }) {
  const content = document.getElementById("studentInfoContent");
  if (!content) return;

  content.innerHTML = `
    <p><strong>Full Name:</strong> ${full_name}</p>
    <p><strong>Phone Number:</strong> ${phone_number}</p>
    <p><strong>Location:</strong> ${location || '-'}</p>
    <p><strong>Schedule:</strong> ${schedule || '-'}</p>
    <p><strong>Attendance:</strong> 
      <label class="switch">
        <input type="checkbox" disabled ${attendance ? 'checked' : ''} />
        <span class="slider round"></span>
      </label>
    </p>
    <button class="manage-trips-btn" onclick="event.stopPropagation(); openChatWith('${full_name}', '${phone_number}')">Chat Now</button>
  `;
  toggleModal("studentInfoModal", true);
}


// ✅ Close modal buttons
function setupModalCloseEvents() {
  const closeIds = [
    { btnId: "closeTripForm", modalId: "tripFormModal" },
    { btnId: "closeTripDetails", modalId: "tripDetailsModal" },
    { btnId: "closeStudentInfo", modalId: "studentInfoModal" }
  ];

  closeIds.forEach(({ btnId, modalId }) => {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.addEventListener("click", () => toggleModal(modalId, false));
    }
  });

  const openBtn = document.getElementById("openTripForm");
  if (openBtn) {
    openBtn.addEventListener("click", () => toggleModal("tripFormModal", true));
  }
}

// ✅ Load trips (you already had this)
async function loadTrips() {
  try {
    const response = await fetch('/owner/dashboard/trips');
    const trips = await response.json();

    const container = document.getElementById('trip-cards');
    container.innerHTML = '';

    trips.forEach(trip => {
      const card = document.createElement('div');
      card.classList.add('trip-card');
      card.innerHTML = `
        <strong>${trip.type.toUpperCase()}</strong><br>
        Bus: ${trip.bus_id}<br>
        ${trip.pickup_time.slice(0,5)} - ${trip.dropoff_time.slice(0,5)}<br>
        <small>To: ${trip.destination_name}</small>
      `;
      card.onclick = () => showTripDetails(trip.trip_id);
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading trips:", err);
  }
}

// ✅ Your other functions like showTripDetails, assignToTrip, removeStudentFromTrip remain unchanged...
async function assignToTrip(selectElement) {
  const trip_id = selectElement.value;
  const student_phone = selectElement.dataset.studentId;

  if (!trip_id) return;

  try {
    const res = await fetch('/owner/dashboard/assign-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_phone, trip_id })
    });

    const result = await res.json();

    if (res.ok) {
      alert(result.message);
      const row = selectElement.closest('tr');
      row.remove();
    } else {
      alert(result.error || 'Failed to assign student');
    }
  } catch (err) {
    console.error('Error assigning student:', err);
    alert('Error assigning student');
  }
}

// ✅ On DOM ready, initialize everything
window.addEventListener('DOMContentLoaded', () => {
  loadTrips();
  loadStudentLists();
  setupModalCloseEvents();
});
async function loadStudentLists() {
  try {
    const [studentsRes, tripsRes] = await Promise.all([
      fetch('/owner/dashboard/students-by-destination'),
      fetch('/owner/dashboard/trips')
    ]);

    const students = await studentsRes.json();
    const trips = await tripsRes.json();

    const grouped = {};
    students.forEach(s => {
      if (!grouped[s.destination_id]) {
        grouped[s.destination_id] = {
          destination_name: s.destination_name,
          students: []
        };
      }
      grouped[s.destination_id].students.push({
        full_name: s.full_name,
        phone_number: s.phone_number,
        location: s.location,
        schedule: s.schedule,
        attendance: s.attendance
      });
    });

    const container = document.getElementById('student-lists');
    container.innerHTML = '';

    for (const [destinationId, group] of Object.entries(grouped)) {
      const groupDiv = document.createElement('div');
      groupDiv.classList.add('manage-trips-destination-group');

      groupDiv.innerHTML = `
        <h4>${group.destination_name}</h4>
        <table class="manage-trips-table">
          <tr><th>Student Name</th><th>Assign to Trip</th></tr>
          ${group.students.map(student => `
            <tr>
              <td><span class="clickable-name" onclick='showStudentInfo(${JSON.stringify(student)})'>${student.full_name}</span></td>
              <td>
                <select class="trip-select" data-student-id="${student.phone_number}" onchange="assignToTrip(this)">
                  <option value="">-- Select Trip --</option>
                  ${trips.map(trip => `
                    <option value="${trip.trip_id}">
                      ${trip.type.toUpperCase()} @ ${trip.pickup_time.slice(0,5)} → ${trip.destination_name}
                    </option>
                  `).join('')}
                </select>
              </td>
            </tr>
          `).join('')}
        </table>
      `;
      container.appendChild(groupDiv);
    }
  } catch (err) {
    console.error("Error loading students or trips:", err);
    document.getElementById('student-lists').innerHTML = `<p style="color: red;">Failed to load student list.</p>`;
  }
}
async function showTripDetails(tripId) {
  try {
    const response = await fetch(`/owner/dashboard/trip/${tripId}`);
    const { trip, students } = await response.json();

    const [busesRes, driversRes, destinationsRes] = await Promise.all([
      fetch('/owner/dashboard/buses'),
      fetch('/owner/dashboard/drivers'),
      fetch('/owner/dashboard/destinations'),
    ]);

    const buses = await busesRes.json();
    const drivers = await driversRes.json();
    const destinations = await destinationsRes.json();

    const container = document.getElementById('tripDetailsContent');
    container.innerHTML = `
      <form id="editTripForm">
        <input type="hidden" name="trip_id" value="${trip.trip_id}" />
        <label>Bus:</label>
        <select name="bus_id">
          ${buses.map(b => `<option value="${b.bus_id}" ${b.bus_id === trip.bus_id ? 'selected' : ''}>${b.bus_name}</option>`).join('')}
        </select>

        <label>Driver:</label>
        <select name="driver_phone">
          ${drivers.map(d => `<option value="${d.phone_number}" ${d.phone_number === trip.driver_phone ? 'selected' : ''}>${d.full_name}</option>`).join('')}
        </select>

        <label>Destination:</label>
        <select name="destination_id">
          ${destinations.map(dest => `<option value="${dest.destination_id}" ${dest.destination_id === trip.destination_id ? 'selected' : ''}>${dest.name}</option>`).join('')}
        </select>

        <label>Pickup Time:</label>
        <input type="time" name="pickup_time" value="${trip.pickup_time.slice(0, 5)}" required />

        <label>Dropoff Time:</label>
        <input type="time" name="dropoff_time" value="${trip.dropoff_time.slice(0, 5)}" required />

        <label>Type:</label>
        <select name="type">
          <option value="morning" ${trip.type === 'morning' ? 'selected' : ''}>Morning</option>
          <option value="return" ${trip.type === 'return' ? 'selected' : ''}>Return</option>
        </select>

        <button type="submit" class="manage-trips-btn">Save Changes</button>
      </form>

      <hr />
      <h4>Students Assigned:</h4>
      <ul>
        ${students.length > 0 ? students.map(s => `
          <li>
            <span class="clickable-name" onclick='showStudentInfo(${JSON.stringify(s)})'>${s.full_name}</span>
            <button onclick="removeStudentFromTrip('${trip.trip_id}', '${s.phone_number}', this)" style="margin-left: 10px; color: red; cursor: pointer;">Remove</button>
          </li>
        `).join('') : '<li>No students assigned.</li>'}
      </ul>
    `;

    toggleModal("tripDetailsModal", true);

    document.getElementById("editTripForm").addEventListener("submit", async function (e) {
      e.preventDefault();
      const formData = new FormData(this);
      const tripData = Object.fromEntries(formData.entries());

      try {
        const res = await fetch(`/owner/dashboard/trip/${tripData.trip_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tripData),
        });

        const result = await res.json();
        if (res.ok) {
          alert('Trip updated successfully');
          toggleModal("tripDetailsModal", false);
          await loadTrips();
          await loadStudentLists();
        } else {
          alert(result.error || 'Failed to update trip');
        }
      } catch (err) {
        console.error('Error updating trip:', err);
        alert('Error updating trip');
      }
    });

  } catch (err) {
    console.error("Failed to load trip details", err);
  }
}
async function removeStudentFromTrip(tripId, studentPhone, buttonElement) {
  try {
    const res = await fetch('/owner/dashboard/unassign-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trip_id: tripId, student_phone: studentPhone }),
    });

    const result = await res.json();
    if (res.ok) {
      alert(result.message);
      // Remove the row or element
      const listItem = buttonElement.closest('li');
      if (listItem) listItem.remove();
    } else {
      alert(result.error || "Unassignment failed");
    }
  } catch (err) {
    console.error("❌ Error removing student from trip:", err);
  }
}

// ✅ Global user
window.currentUser = {
  phone_number: "<%= user.phone_number %>",
  role: "<%= user.role %>",
  username: "<%= user.username %>"
};
