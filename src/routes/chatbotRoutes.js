const express = require('express');
const router = express.Router();
const geocodeAddress = require('../services/googleMapsService');
const db = require('../config/db');

const sessionState = {}; // Per-session memory store

// ✅ Chatbot UI
router.get('/ui', (req, res) => {
  res.render('chatbot');
});

// ✅ Chatbot Message Endpoint
router.post('/message', async (req, res) => {
  const { message, lat, lng, sessionId = 'default' } = req.body;
  const user = sessionState[sessionId] || {};

  try {
    const { findMatchingBusOwners } = require('../services/matchBusService');
    const lowerMsg = message?.toLowerCase().trim() || '';

    // 🔁 Restart chat
    if (lowerMsg.includes('start over') || lowerMsg.includes('restart')) {
      sessionState[sessionId] = {};
      return res.json({ reply: "🔄 Conversation restarted. Are you a student or a driver?" });
    }

    // 1️⃣ Ask for Role
    if (!user.role) {
      if (lowerMsg.includes('student')) {
        user.role = 'student';
        sessionState[sessionId] = user;
        return res.json({ reply: "🎓 What’s your university destination?" });
      } else if (lowerMsg.includes('driver')) {
        user.role = 'driver';
        sessionState[sessionId] = user;
        return res.json({ reply: "🚐 Welcome, driver! What area would you like to serve?" });
      } else {
        return res.json({ reply: "👋 Hello! Are you a student or a driver?" });
      }
    }

    // 2️⃣ Destination Input for Student
    if (user.role === 'student' && !lat && !lng && message && lowerMsg !== 'student') {
      user.destination = message.trim();
      sessionState[sessionId] = user;
      return res.json({
        reply: `📍 Got it! Destination set to ${user.destination}. Now please share your location or click 📍 Share Location.`
      });
    }

    // 3️⃣ Student Sends Location — Perform Matching
    if (user.role === 'student' && user.destination && lat && lng) {
      const owners = await findMatchingBusOwners({ lat, lng }, user.destination);

      if (!owners.length) {
        return res.json({
          reply: `❌ Sorry, no buses found near your location to ${user.destination}.`
        });
      }

      const replies = owners.map((o, index) => {
        return `${index + 1}. 👤 ${o.full_name} – 📞 ${o.phone_number}`;
      });

      return res.json({
        reply: `✅ We found ${owners.length} bus${owners.length > 1 ? 'es' : ''} to ${user.destination}:\n\n${replies.join('\n')}`,
        matchedOwners: owners
      });
    }

    // 4️⃣ Default Fallback
    return res.json({
      reply: "⏳ Waiting for your destination or location to find a bus. You can type 'start over' to restart."
    });

  } catch (err) {
    console.error("❌ Chatbot error:", err);
    return res.json({ reply: "⚠️ Something went wrong. Please try again later." });
  }
});

// ✅ Join Request Handler
router.post('/join-request', async (req, res) => {
  const { ownerPhone, studentName, studentPhone, university, address, pickupPoint } = req.body;

  try {
    await db.query(`
      INSERT INTO join_requests (owner_phone, student_name, student_phone, university, address, pickup_point, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending')
    `, [ownerPhone, studentName, studentPhone, university, address, pickupPoint]);

    res.json({ message: "🎉 Your join request has been sent!" });
  } catch (err) {
    console.error("❌ Join request error:", err);
    res.status(500).json({ message: "Something went wrong while sending your request." });
  }
});

module.exports = router;
