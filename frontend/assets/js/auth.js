document.addEventListener("DOMContentLoaded", function () {
    // Handle signup form submission
    document.getElementById("signup-form").addEventListener("submit", async function (event) {
        event.preventDefault();

        const fullName = document.getElementById("signup-fullname").value;
        const phoneNumber = document.getElementById("signup-phone").value;
        const password = document.getElementById("signup-password").value;

        const response = await fetch("/api/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ full_name: fullName, phone_number: phoneNumber, password })
        });

        const data = await response.json();
        alert(data.message);
        if (response.ok) {
            // Save the token to local storage
            localStorage.setItem("token", data.token);

            // Hide the signup form and show the login form
            document.querySelector(".auth-sign-up").style.display = "none"; // Hide signup
            document.querySelector(".auth-sign-in").style.display = "block"; // Show login
            document.getElementById("login").click(); // Activate the login toggle button
        }
    });

    // Handle login form submission
    document.getElementById("login-form").addEventListener("submit", async function (event) {
        event.preventDefault();
    
        const phoneNumber = document.getElementById("login-phone").value.trim();
        const password = document.getElementById("login-password").value.trim();
    
        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ phone_number: phoneNumber, password })
            });
    
            const data = await response.json();
            alert(data.message);
            if (response.ok) {
                // Save the token and reload the page
                localStorage.setItem("token", data.token);
                window.location.reload();
            }
        } catch (error) {
            console.error("Login Error:", error);
            alert("Failed to log in.");
        }
    });

    // Example function to access protected routes
    async function accessProtectedRoute() {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("Unauthorized! Please login.");
            return;
        }

        const response = await fetch("/api/protected", {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();
        console.log(data);
    }
});
