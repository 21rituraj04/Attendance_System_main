const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const departments = await Department.find().populate('hodId', 'name email').sort({ name: 1 });
    res.json(departments);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const dept = new Department(req.body);
    await dept.save();
    res.json(dept);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!dept) return res.status(404).json({ msg: 'Department not found.' });
    res.json(dept);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Department deleted.' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
