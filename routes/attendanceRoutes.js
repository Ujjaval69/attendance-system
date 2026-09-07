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

// SEED COMPREHENSIVE REALISTIC DEMO ATTENDANCE (Admin Only)
router.post('/seed', auth, roleMiddleware('admin'), async (req, res) => {
  try {
    const students = [
      { email: 'student@demo.edu', name: 'Alex Mercer', rate: 0.92 },
      { email: 'sarah.connor@university.edu', name: 'Sarah Connor', rate: 1.0 },
      { email: 'marcus.wright@university.edu', name: 'Marcus Wright', rate: 0.58 }
    ];

    const subjects = ['Data Structures', 'Machine Learning', 'Computer Networks', 'Linear Algebra'];
    const today = new Date();
    const records = [];

    for (const student of students) {
      for (let daysAgo = 1; daysAgo <= 25; daysAgo++) {
        const d = new Date(today);
        d.setDate(today.getDate() - daysAgo);

        // Skip weekend dates
        if (d.getDay() === 0 || d.getDay() === 6) continue;

        const sub = subjects[(daysAgo + student.name.length) % subjects.length];
        
        let status = 'Present';
        if (student.rate < 0.7) {
          // Marcus Wright: high absence rate to trigger At-Risk Alert (<75%)
          const rand = Math.random();
          status = rand < 0.45 ? 'Absent' : rand < 0.65 ? 'Late' : 'Present';
        } else if (student.rate < 0.95) {
          // Alex Mercer: solid attendance
          const rand = Math.random();
          status = rand < 0.08 ? 'Absent' : rand < 0.2 ? 'Late' : 'Present';
        } else {
          // Sarah Connor: high attendance
          status = Math.random() < 0.15 ? 'Late' : 'Present';
        }

        records.push({
          studentEmail: student.email.toLowerCase(),
          studentName: student.name,
          subject: sub,
          status,
          date: d
        });
      }
    }

    if (records.length > 0) {
      await Attendance.insertMany(records);
    }

    res.json({ 
      message: `Successfully seeded ${records.length} realistic records across 3 student accounts!`, 
      count: records.length 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;