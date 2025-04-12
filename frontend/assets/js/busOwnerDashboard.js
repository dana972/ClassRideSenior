document.addEventListener("DOMContentLoaded", function () {
  const navLinks = document.querySelectorAll(".nav-link");
  const contentSections = document.querySelectorAll(".content-section");

  navLinks.forEach((link) => {
    link.addEventListener("click", function (event) {
      // If the link is meant to trigger the chat modal, let its own script handle it.
      if (this.getAttribute("data-target") === "chats") {
        return;
      }
      event.preventDefault();
      const targetId = this.getAttribute("data-target");

      contentSections.forEach((section) => {
        section.style.display = "none";
      });

      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.style.display = "block";
      }
    });
  });
});

  function removeStudent(phoneNumber) {
    if (!phoneNumber || !confirm("Are you sure you want to remove this student?")) return;
  
    fetch(`/owner/dashboard/student/${phoneNumber}`, {
      method: 'DELETE'
    })
    .then(async res => {
      if (!res.ok) throw new Error("Failed to delete student");
      const data = await res.json();
      if (data.message) {
        document.getElementById(`student-${phoneNumber}`).remove();
      }
    })
    .catch(err => console.error("Error deleting student:", err));
  }
  
  function removeBus(busId) {
    if (!busId || !confirm("Are you sure you want to remove this bus?")) return;
  
    fetch(`/owner/dashboard/bus/${busId}`, { method: 'DELETE' })
      .then(async res => {
        if (!res.ok) throw new Error("Server error");
        const data = await res.json();
        if (data.message) {
          document.getElementById(busId).remove();
        }
      })
      .catch(err => console.error("Error:", err));
  }
  
  function removeDestination(destinationId) {
    if (!destinationId || !confirm("Are you sure you want to remove this destination?")) return;
  
    fetch(`/owner/dashboard/destination/${destinationId}`, { method: 'DELETE' })
      .then(async res => {
        if (!res.ok) throw new Error("Failed to delete destination");
        const data = await res.json();
        if (data.message) {
          document.getElementById(`destination-${destinationId}`).remove();
        }
      })
      .catch(err => console.error("Error deleting destination:", err));
  }
  
  function removeDriver(driverId) {
    if (!driverId || !confirm("Are you sure you want to remove this driver?")) return;
  
    fetch(`/owner/dashboard/driver/${driverId}`, { method: 'DELETE' })
      .then(async res => {
        if (!res.ok) throw new Error("Failed to delete driver");
        const data = await res.json();
        if (data.message) {
          document.getElementById(`driver-${driverId}`).remove();
        }
      })
      .catch(err => console.error("Error deleting driver:", err));
  }
  

  