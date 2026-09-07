const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { email, password, role, adminSecret } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Role-based authorization key check
    if (role === 'admin') {
      const systemSecret = process.env.ADMIN_SECRET_KEY || 'admin123';
      if (adminSecret !== systemSecret) {
        return res.status(403).json({ message: "Access Denied: Invalid Admin Secret Key. You are not authorized to create administrator accounts." });
      }
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: email.toLowerCase(),
      password: hashed,
      role: role || 'student'
    });

    res.json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Wrong password" });

    // Include role and email in token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET REGISTERED STUDENTS (Admin only)
router.get('/students', auth, roleMiddleware('admin'), async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('email -_id');
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// INSTANT DEMO LOGIN (One-click instant site testing)
router.post('/demo-login', async (req, res) => {
  try {
    const { role } = req.body;
    const targetRole = role === 'student' ? 'student' : 'admin';
    const demoEmail = targetRole === 'admin' ? 'admin@demo.edu' : 'student@demo.edu';
    const demoPassword = 'demopassword123';

    let user = await User.findOne({ email: demoEmail });
    if (!user) {
      const hashed = await bcrypt.hash(demoPassword, 10);
      user = await User.create({
        email: demoEmail,
        password: hashed,
        role: targetRole
      });
    }

    // Ensure demo student accounts exist so admin has students in dropdown
    const demoStudents = [
      { email: 'student@demo.edu' },
      { email: 'sarah.connor@university.edu' },
      { email: 'marcus.wright@university.edu' }
    ];

    for (const ds of demoStudents) {
      const exists = await User.findOne({ email: ds.email });
      if (!exists) {
        const hashed = await bcrypt.hash(demoPassword, 10);
        await User.create({ email: ds.email, password: hashed, role: 'student' });
      }
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '24h' }
    );

    res.json({ token, role: user.role, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;