const express = require("express");
const http = require("http");
const path = require("path");
const cookieParser = require("cookie-parser");
const socketIo = require("socket.io");
require("dotenv").config();

// 🧠 Custom modules
const db = require("./src/config/db"); // PostgreSQL setup (pg.Pool instance)
const authenticateUser = require("./src/middlewares/authMiddleware");
const busOwnerRoutes = require("./src/routes/busOwnerRoutes");
const authRoutes = require("./src/routes/authRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const studentDashboardRoute = require("./src/routes/studentDashboardRoute");
const chatRoutes = require("./src/routes/chatsRoutes");
const beOwnerRoutes = require("./src/routes/beOwnerRoutes");



// App setup
const app = express();
const server = http.createServer(app); // For Socket.IO
const io = socketIo(server);

// Port
const PORT = process.env.PORT || 5000;

// View engine setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "./src/views"));

// Middleware stack
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "frontend")));
app.use(cookieParser());

// ✅ Globally available user in all EJS templates
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// Routes
app.get("/", (req, res) => res.render("index"));
app.use("/api", authRoutes); // login/register

// Protected routes
app.use("/owner", authenticateUser, busOwnerRoutes);
app.use("/student", authenticateUser, studentDashboardRoute);
app.use("/", authenticateUser, dashboardRoutes);
app.use("/", chatRoutes); // or use "/chats" if you want to prefix all chat routes
app.use("/owner", authenticateUser, beOwnerRoutes);

// ✅ Socket.IO logic
io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  // Existing private messaging logic:
  // Join user’s personal room using phone number
  socket.on("join", (phone) => {
    socket.join(phone);
    console.log(`📲 ${phone} joined their chat room`);
  });

  // Handle private messages (1-on-1 based on phone numbers)
  socket.on("privateMessage", async ({ from, to, message }) => {
    console.log(`💬 ${from} ➡️ ${to}: ${message}`);
    try {
      // Save the private message to the database
      await db.query(
        `INSERT INTO messages (sender_phone, receiver_phone, message) VALUES ($1, $2, $3)`,
        [from, to, message]
      );
      // Emit the message to the receiver’s personal room
      io.to(to).emit("privateMessage", { from, message });
    } catch (err) {
      console.error("❌ Error saving private message:", err);
    }
  });

  // New conversation-based real-time chat events:
  // Join a conversation room using the chat id
  socket.on("joinConversation", (chatId) => {
    socket.join(chatId);
    console.log(`Socket ${socket.id} joined conversation room: ${chatId}`);
  });

  // Listen for new conversation messages
  socket.on("sendMessage", async (data) => {
    // data should include: { chatId, sender_phone, message_text }
    console.log(`New message in chat ${data.chatId}:`, data.message_text);
    try {
      // Insert the new message into the messages table
      const result = await db.query(
        'INSERT INTO messages (chat_id, sender_phone, message_text, sent_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
        [data.chatId, data.sender_phone, data.message_text]
      );
      const message = result.rows[0];

      // Get the sender's full name from the users table
      const senderResult = await db.query(
        'SELECT full_name FROM users WHERE phone_number = $1',
        [data.sender_phone]
      );
      message.sender_name = senderResult.rows[0].full_name;

      // Broadcast the new message to all clients in the conversation room
      io.to(data.chatId).emit("newMessage", message);
    } catch (err) {
      console.error("Error sending conversation message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
