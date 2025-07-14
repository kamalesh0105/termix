const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const { v4: uuidv4 } = require("uuid");

dotenv.config();

const terminalController = require("./controllers/terminal");
const dockerController = require("./controllers/docker");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

app.use("/api/terminal", require("./routes/terminal"));

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("create-session", async ({ sessionId }) => {
    try {
      const id = sessionId || uuidv4();

      let containerId = await dockerController.getContainerForSession(id);

      if (!containerId) {
        containerId = await dockerController.createContainer(id);
      }

      const terminal = await terminalController.createTerminal(id, containerId);

      socket.emit("session-created", {
        id,
        message: "Terminal session created successfully",
      });

      terminal.on("data", (data) => {
        socket.emit("terminal-output", data.toString());
      });

      socket.on("terminal-input", ({ sessionId, data }) => {
        if (sessionId === id) {
          terminal.write(data);
        }
      });

      socket.on("terminal-resize", ({ sessionId, dimensions }) => {
        if (sessionId === id && dimensions) {
          terminalController.resizeTerminal(id, dimensions);
        }
      });

    
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

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});


const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

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
