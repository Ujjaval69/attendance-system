const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, async (req, res) => {
  const data = await Attendance.find();
  res.json(data);
});

router.post('/', auth, async (req, res) => {
  const data = await Attendance.create(req.body);
  res.json(data);
});

router.put('/:id', auth, async (req, res) => {
  const updated = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

router.delete('/:id', auth, async (req, res) => {
  await Attendance.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router;