const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

const authRoutes = require("./routes/auth");
const orgRoutes = require("./routes/orgs");
const boardRoutes = require("./routes/boards");
const columnRoutes = require("./routes/columns");
const cardRoutes = require("./routes/cards");

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/orgs", orgRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/columns", columnRoutes);
app.use("/api/cards", cardRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Planora Trello clone API",
    health: "/health",
    apiBase: "/api",
  });
});

app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

async function startServer() {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
