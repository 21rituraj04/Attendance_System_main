const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.use(verifyToken, requireAdmin);

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [totalTeachers, totalStudents, totalSessions, activeSessions, totalAttendance] = await Promise.all([
      User.countDocuments({ role: 'teacher', status: 'active' }),
      User.countDocuments({ role: 'student', status: 'active' }),
      Session.countDocuments(),
      Session.countDocuments({ status: 'active' }),
      Attendance.countDocuments(),
    ]);

    // Today's sessions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaySessions = await Session.countDocuments({ createdAt: { $gte: today } });

    // Today's attendance
    const todayAttendance = await Attendance.countDocuments({ markedAt: { $gte: today } });

    // Overall attendance rate (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSessions = await Session.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
    const recentAttendance = await Attendance.countDocuments({ markedAt: { $gte: thirtyDaysAgo } });
    const avgRate = recentSessions > 0 && totalStudents > 0
      ? Math.round((recentAttendance / (recentSessions * totalStudents)) * 100)
      : 0;

    res.json({
      totalTeachers, totalStudents, totalSessions, activeSessions,
      totalAttendance, todaySessions, todayAttendance,
      attendanceRate: Math.min(avgRate, 100),
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ─── TEACHER PERFORMANCE REPORT ───────────────────────────────────────────────
router.get('/teacher-performance', async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher', status: 'active' }).select('-password');
    const performance = await Promise.all(teachers.map(async (teacher) => {
      const sessions = await Session.countDocuments({ teacherId: teacher._id });
      const activeSess = await Session.countDocuments({ teacherId: teacher._id, status: 'active' });
      const attendance = await Attendance.countDocuments({ teacherId: teacher._id });
      const lastSession = await Session.findOne({ teacherId: teacher._id }).sort({ createdAt: -1 });
      return {
        teacher: { _id: teacher._id, name: teacher.name, email: teacher.email, department: teacher.department, employeeId: teacher.employeeId, status: teacher.status },
        sessions,
        activeSessions: activeSess,
        totalAttendance: attendance,
        lastActivity: lastSession?.createdAt || null,
      };
    }));
    res.json(performance);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ─── ATTENDANCE ANALYTICS (department/subject/date breakdowns) ───────────────
router.get('/analytics', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Subject-wise attendance
    const subjectWise = await Attendance.aggregate([
      { $match: { markedAt: { $gte: since } } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Daily attendance (last N days)
    const daily = await Attendance.aggregate([
      { $match: { markedAt: { $gte: since } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$markedAt' } },
        count: { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]);

    // Semester-wise attendance
    const semesterWise = await Attendance.aggregate([
      { $match: { markedAt: { $gte: since } } },
      { $group: { _id: '$semester', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Session activity
    const sessionActivity = await Session.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]);

    res.json({ subjectWise, daily, semesterWise, sessionActivity });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ─── RECENT ACTIVITY LOG ─────────────────────────────────────────────────────
router.get('/activity', async (req, res) => {
  try {
    const recentSessions = await Session.find()
      .populate('teacherId', 'name employeeId')
      .sort({ createdAt: -1 })
      .limit(20);

    const recentAttendance = await Attendance.find()
      .populate('teacherId', 'name')
      .sort({ markedAt: -1 })
      .limit(20);

    res.json({ recentSessions, recentAttendance });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
