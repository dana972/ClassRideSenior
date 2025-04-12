document.addEventListener("DOMContentLoaded", function () {
    // View Join Requests Button functionality
    document.getElementById('viewRequestsButton').addEventListener('click', function() {
        document.getElementById('joinRequestsModal').style.display = 'flex';
    });

        // Function to close modal
        function closeModal(modalId) {
          document.getElementById(modalId).style.display = 'none';
        }
      
        // Close modal when clicking on the X button (close icon)
        const closeModalButtons = document.querySelectorAll('.close-modal');
        closeModalButtons.forEach(button => {
          button.addEventListener('click', function() {
            const modalId = button.closest('.modal').id; // Get the modal ID
            closeModal(modalId); // Close the respective modal
          });
        });
      
        // Open modal for adding a Bus
        document.querySelector('.add-button.add-bus').addEventListener('click', function() {
          document.getElementById('addBusModal').style.display = 'flex';
        });
      
        // Open modal for adding a Destination
        document.querySelector('.add-button.add-destination').addEventListener('click', function() {
          document.getElementById('addDestinationModal').style.display = 'flex';
        });
      
        // Submit form for adding a Bus
        document.getElementById('addBusForm').addEventListener('submit', function(e) {
          e.preventDefault();
          alert('Bus Added!');
          closeModal('addBusModal');
        });
      
        // Submit form for adding a Destination
        document.getElementById('addDestinationForm').addEventListener('submit', function(e) {
          e.preventDefault();
          alert('Destination Added!');
          closeModal('addDestinationModal');
        });
      
        // Other modal-related JavaScript remains the same...
      });
