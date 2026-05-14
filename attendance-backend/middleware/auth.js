const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── VERIFY JWT TOKEN ────────────────────────────────────────────────────────
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ msg: 'Access denied. No token provided.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ msg: 'User not found. Token invalid.' });
    if (user.status === 'inactive') return res.status(403).json({ msg: 'Account is deactivated. Contact admin.' });
    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return res.status(401).json({ msg: 'Token expired.', expired: true });
    return res.status(401).json({ msg: 'Invalid token.' });
  }
};

// ─── ROLE GUARDS ─────────────────────────────────────────────────────────────
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Admin access required.' });
  next();
};

const requireTeacher = (req, res, next) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Teacher access required.' });
  }
  next();
};

const requireStudent = (req, res, next) => {
  if (req.user.role !== 'student') return res.status(403).json({ msg: 'Student access required.' });
  next();
};

const requireAdminOrTeacher = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
    return res.status(403).json({ msg: 'Unauthorized.' });
  }
  next();
};

module.exports = { verifyToken, requireAdmin, requireTeacher, requireStudent, requireAdminOrTeacher };
