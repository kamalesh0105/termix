const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");

// Load environment variables
dotenv.config();

// Import controllers
const terminalController = require("./controllers/terminal");
const dockerController = require("./controllers/docker");

// Initialize app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

// Static files
app.use(express.static(path.join(__dirname, "../client/dist")));

// Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// API routes
app.use("/api/terminal", require("./routes/terminal"));

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  // Create new terminal session
  socket.on("create-session", async ({ sessionId }) => {
    try {
      // Generate a session ID if not provided
      const id = sessionId || uuidv4();

      // Check if container exists for this session
      let containerId = await dockerController.getContainerForSession(id);

      // Create a new container if none exists
      if (!containerId) {
        containerId = await dockerController.createContainer(id);
      }

      // Create terminal for this session
      const terminal = await terminalController.createTerminal(id, containerId);

      // Send success message
      socket.emit("session-created", {
        id,
        message: "Terminal session created successfully",
      });

      // Handle terminal data
      terminal.on("data", (data) => {
        socket.emit("terminal-output", data.toString());
      });

      // Handle terminal input
      socket.on("terminal-input", ({ sessionId, data }) => {
        if (sessionId === id) {
          terminal.write(data);
        }
      });

      // Handle terminal resize
      socket.on("terminal-resize", ({ sessionId, dimensions }) => {
        if (sessionId === id && dimensions) {
          terminalController.resizeTerminal(id, dimensions);
        }
      });

      // Handle session end
      socket.on("end-session", ({ sessionId }) => {
        if (sessionId === id) {
          terminalController.endTerminal(id);
        }
      });
    } catch (error) {
      console.error("Error creating session:", error);
      socket.emit("error", { message: "Failed to create terminal session" });
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Handle all other routes - serve the React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("HTTP server closed");
  });

  terminalController
    .cleanupAllTerminals()
    .then(() => {
      console.log("All terminal sessions cleaned up");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Error cleaning up terminals:", err);
      process.exit(1);
    });
});
