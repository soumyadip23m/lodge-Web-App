// backend/routes/users.js (updated)
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Register a new user
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists.' });
    }

    const user = new User({ name, email, password, role: 'user' });
    await user.save();
    res.status(201).json({ message: 'Registration successful' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password, loginType } = req.body;

  try {
    if (loginType === 'admin') {
      const admin = await User.findOne({ email, role: 'admin' });
      if (!admin || admin.password !== password) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      return res.json({ role: 'admin', email: admin.email });
    } else {
      const user = await User.findOne({ email, role: 'user' });
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      return res.json({ role: 'user', name: user.name, email: user.email });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user or admin profile
router.get('/profile', async (req, res) => {
  const { email } = req.query;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update user or admin profile
router.put('/profile', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (password) user.password = password;

    await user.save();
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;