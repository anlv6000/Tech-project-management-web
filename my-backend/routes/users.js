const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  const users = await User.find().select('name email role').lean();
  res.json(users);
});

// update user (self or admin)
router.patch('/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    if (!(String(req.user._id) === String(id) || req.user.role === 'admin')) return res.status(403).json({ message: 'Not allowed' });
    const { name, password } = req.body;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (name) user.name = name;
    if (password) {
      const bcrypt = require('bcryptjs');
      user.passwordHash = await bcrypt.hash(password, 8);
    }
    await user.save();
    res.json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
