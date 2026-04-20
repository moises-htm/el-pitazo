// Server entry point — Express + WebSocket + Socket.IO
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/auth");
const tournamentRoutes = require("./routes/tournaments");
const teamRoutes = require("./routes/teams");
const matchRoutes = require("./routes/matches");
const paymentRoutes = require("./routes/payments");
const refereeRoutes = require("./routes/referees");
const mediaRoutes = require("./routes/media");
const analyticsRoutes = require("./routes/analytics");

app.use("/api/auth", authRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/referees", refereeRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/analytics", analyticsRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// WebSocket connections
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_tournament", (tournamentId) => {
    socket.join(`tournament:${tournamentId}`);
    console.log(`User ${socket.id} joined tournament ${tournamentId}`);
  });

  socket.on("score_update", (data) => {
    io.to(`tournament:${data.tournamentId}`).emit("score_update", data);
  });

  socket.on("bracket_update", (data) => {
    io.to(`tournament:${data.tournamentId}`).emit("bracket_update", data);
  });

  socket.on("notification_broadcast", (data) => {
    io.to(`tournament:${data.tournamentId}`).emit("notification", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🏟️ El Pitazo server running on port ${PORT}`);
});

module.exports = { app, io, server };
