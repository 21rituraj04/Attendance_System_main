const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.use(verifyToken);

// GET classes — admin sees all, teacher sees assigned, student sees assigned
router.get('/', async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'teacher') {
      query.$or = [{ teacherIds: req.user._id }, { departmentName: req.user.department }];
    } else if (req.user.role === 'student') {
      query.studentIds = req.user._id;
    }

    const classes = await Class.find(query)
      .populate('teacherIds', 'name employeeId')
      .populate('subjectIds', 'name code')
      .sort({ semester: 1, section: 1 });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const cls = new Class(req.body);
    await cls.save();
    res.json(cls);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const cls = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cls) return res.status(404).json({ msg: 'Class not found.' });
    res.json(cls);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await Class.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Class deleted.' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
