require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const logger = require("./middleware/logger");
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();

// Connect Database
connectDB();

app.use(cors());
app.use(express.json());
app.use(logger); // Logger middleware

app.use(express.static(path.join(__dirname, "public")));

const authRoutes = require("./routes/authRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);

// default → landing page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Error handling middleware (must be last)
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});