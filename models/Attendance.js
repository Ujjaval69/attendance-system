const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  name: String,
  subject: String,
  status: String
});

module.exports = mongoose.model('Attendance', attendanceSchema);