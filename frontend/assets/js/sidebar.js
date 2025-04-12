document.addEventListener("DOMContentLoaded", function () {
    const links = document.querySelectorAll(".nav-link");
    const sections = document.querySelectorAll(".content-section");
  
    // Function to show selected section and hide others
    function showSection(target) {
      sections.forEach(section => {
        section.style.display = section.id === target ? "block" : "none";
      });
    }
  
    // Set default active section (e.g., Dashboard)
    showSection("dashboard");
  
    // Add click event listener to each link
    links.forEach(link => {
      link.addEventListener("click", function (event) {
        event.preventDefault(); // Prevent default anchor behavior
        const target = this.getAttribute("data-target");
        if (target) {
          showSection(target);
        }
      });
    });
  });
  
  // Sidebar toggler
  document.querySelector('.sidebar-toggler').addEventListener('click', function() {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('collapsed');
  });
  
  // For the small screen sidebar menu button toggling
  document.querySelector('.sidebar-menu-button').addEventListener('click', function() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('collapsed');
  });
  