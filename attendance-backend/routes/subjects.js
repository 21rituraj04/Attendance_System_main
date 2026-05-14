const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const { verifyToken, requireAdmin, requireTeacher } = require('../middleware/auth');

router.use(verifyToken);

// GET subjects — admin sees all, teacher sees own/dept, student sees by semester
router.get('/', async (req, res) => {
  try {
    let query = { status: 'active' };
    if (req.user.role === 'teacher') {
      query.$or = [{ teacherId: req.user._id }, { departmentId: req.user.departmentId }];
    } else if (req.user.role === 'student') {
      if (req.user.departmentId) query.departmentId = req.user.departmentId;
      if (req.query.semester) query.semester = req.query.semester;
    }
    const subjects = await Subject.find(query)
      .populate('teacherId', 'name')
      .sort({ semester: 1, name: 1 });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// CREATE subject (admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const subject = new Subject(req.body);
    await subject.save();
    res.json(subject);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// UPDATE subject (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!subject) return res.status(404).json({ msg: 'Subject not found.' });
    res.json(subject);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// DELETE subject (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Subject deleted.' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
