const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const client = require("../config/db");
require("dotenv").config();

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { phone_number: user.phone_number, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
};

// Signup Controller (Defaults new users to 'owner' role)
exports.signup = async (req, res) => {
    const { full_name, phone_number, password, role } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userRole = role || 'owner'; // Default role is 'owner' if not provided

        const result = await client.query(
            "INSERT INTO users (full_name, phone_number, password, role) VALUES ($1, $2, $3, $4) RETURNING *",
            [full_name, phone_number, hashedPassword, userRole]
        );

        const token = generateToken(result.rows[0]);

        // Set HttpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // Change to 'true' if using HTTPS
            sameSite: 'Strict',
            maxAge: 3600000 // 1 hour
        });

        res.status(201).json({ message: "Signup successful", user: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error signing up" });
    }
};

// Login Controller
exports.login = async (req, res) => {
    const { phone_number, password } = req.body;

    try {
        const result = await client.query("SELECT * FROM users WHERE phone_number = $1", [phone_number]);

        if (result.rows.length === 0) {
            return res.status(400).json({ message: "User not found" });
        }

        const user = result.rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = generateToken(user);

        // Set HttpOnly cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'Strict',
            maxAge: 3600000
        });

        res.json({ message: "Login successful", role: user.role });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error logging in" });
    }
};

// Logout Controller - Clears the token cookie
exports.logout = (req, res) => {
    res.cookie("token", "", { expires: new Date(0), httpOnly: true });
    res.json({ message: "Logged out successfully" });
};

// Middleware to verify token from cookies
exports.verifyToken = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: "Forbidden: Invalid token" });
    }
};

// Check Authentication Status & Role
exports.checkAuth = async (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ authenticated: false, message: "Not authenticated" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Fetch user role from the database for extra security
        const result = await client.query("SELECT role FROM users WHERE phone_number = $1", [decoded.phone_number]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ authenticated: false, message: "User not found" });
        }

        const role = result.rows[0].role;
        return res.json({ authenticated: true, role });
    } catch (err) {
        res.status(401).json({ authenticated: false, message: "Invalid token" });
    }
};

// Example Protected Route
exports.protectedRoute = (req, res) => {
    res.json({ message: "You have access to this protected route", user: req.user });
};
