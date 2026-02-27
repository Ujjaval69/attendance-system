const express = require("express");
const app = express();

const attendanceRoutes = require("./routes/attendanceRoutes");
const logger = require("./middleware/logger");

app.use(express.json());
app.use(logger);

// serve frontend
app.use(express.static("public"));

// routes
app.use("/api/attendance", attendanceRoutes);

// error handling
app.use((req,res)=>{
    res.status(404).send("Page Not Found");
});

app.listen(3000, ()=>{
    console.log("Server running on http://localhost:3000");
});