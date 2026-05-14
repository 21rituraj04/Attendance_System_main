const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const { verifyToken, requireTeacher, requireAdmin } = require('../middleware/auth');

router.use(verifyToken);

// ─── GET ATTENDANCE ───────────────────────────────────────────────────────────
// Admin: all | Teacher: own sessions | Student: own records
router.get('/', async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'teacher') {
      query.teacherId = req.user._id;
    } else if (req.user.role === 'student') {
      query.enrollment = req.user.enrollment;
    }
    // admin: no filter — sees all

    const { sessionId, enrollment, subject, semester, section } = req.query;
    if (sessionId) query.sessionId = sessionId;
    if (enrollment && req.user.role !== 'student') query.enrollment = enrollment;
    if (subject) query.subject = subject;
    if (semester) query.semester = semester;
    if (section) query.section = section;

    const records = await Attendance.find(query)
      .populate('teacherId', 'name employeeId')
      .sort({ markedAt: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── MARK ATTENDANCE (Student via PIN/QR) ────────────────────────────────────
router.post('/mark', async (req, res) => {
  try {
    const { pin, sessionId, method, fingerprint } = req.body;
    let session;

    if (method === 'pin' || method === 'qr-pin') {
      const cleanPin = String(pin || '').trim().replace(/^ATTENDX:/i, '');
      session = await Session.findOne({ pin: cleanPin });
      if (!session) return res.status(400).json({ ok: false, reason: 'Invalid PIN.' });
    } else {
      session = await Session.findById(sessionId);
      if (!session) return res.status(400).json({ ok: false, reason: 'Session not found.' });
    }

    if (session.status === 'locked')  return res.status(400).json({ ok: false, reason: 'Session is locked.' });
    if (session.status !== 'active')  return res.status(400).json({ ok: false, reason: `Session is ${session.status}.` });
    if (session.expireAt && new Date(session.expireAt) < new Date()) {
      session.status = 'expired';
      await session.save();
      return res.status(400).json({ ok: false, reason: 'Session has expired.' });
    }

    const student = req.user;
    if (String(session.semester) !== String(student.semester) || session.section !== student.section) {
      return res.status(400).json({
        ok: false,
        reason: `Session is for Sem ${session.semester} Sec ${session.section}. You are in Sem ${student.semester} Sec ${student.section}.`
      });
    }

    const existing = await Attendance.findOne({ enrollment: student.enrollment, sessionId: session._id });
    if (existing) return res.status(400).json({ ok: false, reason: 'Attendance already marked for this session.' });

    const record = new Attendance({
      sessionId: session._id,
      teacherId: session.teacherId,
      studentId: student._id,
      enrollment: student.enrollment,
      studentName: student.name,
      subject: session.subject,
      subjectId: session.subjectId,
      semester: student.semester,
      section: student.section,
      departmentId: session.departmentId,
      method: method || 'pin',
      fingerprint,
    });
    await record.save();
    await Session.findByIdAndUpdate(session._id, { $inc: { attendeeCount: 1 } });

    res.json({ ok: true, subject: session.subject });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── MANUAL MARK (Teacher / Admin) ───────────────────────────────────────────
router.post('/manual', requireTeacher, async (req, res) => {
  try {
    const record = new Attendance({
      ...req.body,
      teacherId: req.user.role === 'teacher' ? req.user._id : req.body.teacherId,
    });
    await record.save();
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── DELETE ATTENDANCE (Teacher owns it, Admin can delete any) ───────────────
router.delete('/:id', requireTeacher, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    if (req.user.role === 'teacher') query.teacherId = req.user._id;

    const record = await Attendance.findOne(query);
    if (!record) return res.status(404).json({ msg: 'Record not found.' });

    await Attendance.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
