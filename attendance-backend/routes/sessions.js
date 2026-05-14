const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const { verifyToken, requireTeacher, requireAdmin } = require('../middleware/auth');

router.use(verifyToken);

// ─── GET SESSIONS ─────────────────────────────────────────────────────────────
// Admin: sees all | Teacher: sees own | Student: sees by semester/section
router.get('/', async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'teacher') {
      query.teacherId = req.user._id;
    } else if (req.user.role === 'student') {
      query.semester = req.user.semester;
      query.section = req.user.section;
    }
    // admin: no filter — sees all sessions
    const sessions = await Session.find(query)
      .populate('teacherId', 'name employeeId')
      .sort({ createdAt: -1 });

    const sessionsWithCounts = await Promise.all(
      sessions.map(async (s) => {
        const count = await Attendance.countDocuments({ sessionId: s._id });
        return { ...s._doc, attendeeCount: count };
      })
    );
    res.json(sessionsWithCounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── CREATE SESSION (Teacher or Admin) ───────────────────────────────────────
router.post('/', requireTeacher, async (req, res) => {
  try {
    const teacherId = req.user.role === 'teacher' ? req.user._id : req.body.teacherId || req.user._id;
    const session = new Session({
      ...req.body,
      teacherId,
      createdBy: req.user.name,
    });
    await session.save();
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── UPDATE SESSION STATUS (Teacher owns it, or Admin) ───────────────────────
router.patch('/:id/status', requireTeacher, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    if (req.user.role === 'teacher') query.teacherId = req.user._id;

    const session = await Session.findOne(query);
    if (!session) return res.status(404).json({ msg: 'Session not found.' });

    session.status = req.body.status;
    await session.save();
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── DELETE SESSION (Teacher owns it, or Admin) ───────────────────────────────
router.delete('/:id', requireTeacher, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    if (req.user.role === 'teacher') query.teacherId = req.user._id;

    const session = await Session.findOne(query);
    if (!session) return res.status(404).json({ msg: 'Session not found.' });

    await Session.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
