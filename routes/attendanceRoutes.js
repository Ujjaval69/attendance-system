const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const auth = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// GET ALL / USER SPECIFIC ATTENDANCE
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // Students can only see their own attendance records
    if (req.user.role === 'student') {
      query.studentEmail = req.user.email.toLowerCase();
    }
    
    const data = await Attendance.find(query).sort({ date: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE ATTENDANCE (Admin Only)
router.post('/', auth, roleMiddleware('admin'), async (req, res) => {
  try {
    const { studentEmail, studentName, subject, status, date } = req.body;
    
    if (!studentEmail || !studentName || !subject || !status) {
      return res.status(400).json({ message: "All fields (studentEmail, studentName, subject, status) are required" });
    }
    
    const record = await Attendance.create({
      studentEmail: studentEmail.toLowerCase(),
      studentName,
      subject,
      status,
      date: date || new Date()
    });
    
    res.status(201).json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE ATTENDANCE (Admin Only)
router.put('/:id', auth, roleMiddleware('admin'), async (req, res) => {
  try {
    const updated = await Attendance.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Attendance record not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE ATTENDANCE (Admin Only)
router.delete('/:id', auth, roleMiddleware('admin'), async (req, res) => {
  try {
    const deleted = await Attendance.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Attendance record not found" });
    }
    res.json({ message: "Attendance record deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;