const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let users = {}; // Store logged-in users as { socketId: username }

// Middleware to serve static files
app.use(express.static("public"));
app.use(express.json());

// Handle socket.io connections
io.on("connection", (socket) => {
  console.log("A user connected");

  // Handle user login
  socket.on("login", async (data) => {
    const { username, password } = data;

    try {
      const response = await axios.post("http://localhost:5000/login", {
        username,
        password,
      });

      if (response.data.status === "success") {
        // Save the logged-in user
        users[socket.id] = username;

        // Notify the client of successful login
        socket.emit("loginSuccess", "Login successful!");

        // Broadcast the updated user list to all clients
        io.emit("updateUserList", Object.values(users));
      } else {
        socket.emit("loginFailure", "Invalid username or password.");
      }
    } catch (error) {
      socket.emit(
        "loginFailure",
        error.response?.data?.message || "Login failed due to server error."
      );
    }
  });

  // Handle user signup
  socket.on("signup", async (data) => {
    const { username, password } = data;

    try {
      const response = await axios.post("http://localhost:5000/signup", {
        username,
        password,
      });

      if (response.data.status === "success") {
        // Notify the client that signup was successful
        socket.emit("signupSuccess", "Signup successful! You can now log in.");

        // Optionally, you could log the user in automatically after a successful signup
        socket.emit("login", { username, password }); // Automatically try to log them in
      } else {
        socket.emit("signupFailure", response.data.message || "Signup failed.");
      }
    } catch (error) {
      socket.emit(
        "signupFailure",
        error.response?.data?.message || "Signup failed due to server error."
      );
    }
  });

  // Handle group messages
  socket.on("sendGroupMessage", (message) => {
    const username = users[socket.id];
    if (username) {
      io.emit("groupMessage", { from: username, message });
    }
  });

  // Handle private messages
  socket.on("requestPrivateChat", (data) => {
    const { toUsername, message } = data;

    const fromUsername = users[socket.id];

    // Prevent private messages to self
    if (toUsername === fromUsername) {
      socket.emit(
        "privateChatError",
        "You cannot send a private message to yourself."
      );
      return;
    }

    // Find the recipient's socket ID
    const toSocketId = Object.keys(users).find(
      (id) => users[id] === toUsername
    );

    if (toSocketId) {
      // Send the private message to the recipient
      io.to(toSocketId).emit("privateChatRequest", {
        fromUsername,
        message,
      });
    } else {
      // If the recipient is not found (e.g., logged out)
      socket.emit("privateChatError", "User not found or not online.");
    }
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    // Remove the user from the active users list
    delete users[socket.id];

    // Notify all clients of the updated user list
    io.emit("updateUserList", Object.values(users));
    console.log("A user disconnected");
  });

  // Handle user logout
  socket.on("logout", (data) => {
    const { username } = data;

    // Remove the user from the active users list
    delete users[socket.id]; // Remove the user from the users object

    // Emit the updated users list to all clients
    io.emit("updateUserList", Object.values(users));

    console.log(`${username} logged out.`);
  });
});

// Start the server
const PORT = 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://192.168.29.13:${PORT}`);
});
