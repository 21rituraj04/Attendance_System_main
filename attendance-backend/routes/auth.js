const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyToken, requireAdmin, requireAdminOrTeacher } = require('../middleware/auth');

const generateToken = (user, expiresIn = '7d') =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn });

// ─── GET CURRENT USER (Persistent Login) ────────────────────────────────────
router.get('/me', verifyToken, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// ─── UNIFIED LOGIN (Admin / Teacher / Student) ───────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) return res.status(400).json({ msg: 'Please provide credentials.' });

    const user = await User.findOne({
      $or: [{ email: identifier }, { enrollment: identifier }, { employeeId: identifier }]
    });
    if (!user) return res.status(400).json({ msg: 'User not found.' });
    if (user.status === 'inactive') return res.status(403).json({ msg: 'Account is deactivated. Contact admin.' });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(400).json({ msg: 'Invalid password.' });

    const token = generateToken(user);
    const userData = { ...user._doc };
    delete userData.password;

    res.json({ token, user: userData });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// ─── OPEN REGISTER STUDENT ────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, enrollment, email, password, semester, section, department } = req.body;
    if (!name || !enrollment || !password) return res.status(400).json({ msg: 'Name, enrollment and password are required.' });

    const existing = await User.findOne({ $or: [{ enrollment }, ...(email ? [{ email }] : [])] });
    if (existing) return res.status(400).json({ msg: 'Student with this enrollment or email already exists.' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const student = new User({
      role: 'student',
      name, enrollment,
      email: email || `${enrollment}@student.attendx.local`,
      password: hashedPassword,
      semester: semester || '1',
      section: section || 'A',
      department,
      status: 'active',
    });
    await student.save();
    
    // Generate token for auto-login after register
    const token = generateToken(student);
    const userData = { ...student._doc };
    delete userData.password;

    res.json({ msg: 'Registration successful!', token, user: userData });
  } catch (err) {
    res.status(500).json({ msg: 'Registration failed.', error: err.message });
  }
});

// ─── REGISTER STUDENT (Admin creates student) ────────────────────────────────
router.post('/register-student', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, enrollment, email, password, semester, section, phone, department, departmentId, rollNumber, year } = req.body;
    if (!name || !enrollment || !password) return res.status(400).json({ msg: 'Name, enrollment and password are required.' });

    const existing = await User.findOne({ $or: [{ enrollment }, ...(email ? [{ email }] : [])] });
    if (existing) return res.status(400).json({ msg: 'Student with this enrollment or email already exists.' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const student = new User({
      role: 'student',
      name, enrollment,
      email: email || `${enrollment}@student.attendx.local`,
      password: hashedPassword,
      semester: semester || '1',
      section: section || 'A',
      phone, department, departmentId, rollNumber, year,
      status: 'active',
    });
    await student.save();
    res.json({ msg: 'Student registered successfully!', student: { ...student._doc, password: undefined } });
  } catch (err) {
    res.status(500).json({ msg: 'Registration failed.', error: err.message });
  }
});

// ─── REGISTER TEACHER (Admin creates teacher) ────────────────────────────────
router.post('/register-teacher', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, employeeId, department, departmentId, designation, qualification, specialization, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ msg: 'Name, email and password are required.' });

    const existing = await User.findOne({ $or: [{ email }, ...(employeeId ? [{ employeeId }] : [])] });
    if (existing) return res.status(400).json({ msg: 'Teacher with this email/employee ID already exists.' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const teacher = new User({
      role: 'teacher',
      name, email,
      password: hashedPassword,
      employeeId, department, departmentId,
      designation: designation || 'Assistant Professor',
      qualification, specialization, phone,
      status: 'active',
    });
    await teacher.save();
    res.json({ msg: 'Teacher registered successfully!', teacher: { ...teacher._doc, password: undefined } });
  } catch (err) {
    res.status(500).json({ msg: 'Registration failed.', error: err.message });
  }
});

// ─── GET ALL STUDENTS (Admin & Teacher) ──────────────────────────────────────
router.get('/students', verifyToken, requireAdminOrTeacher, async (req, res) => {
  try {
    const { department, semester, section } = req.query;
    let query = { role: 'student' };
    if (department) query.department = department;
    if (semester) query.semester = semester;
    if (section) query.section = section;
    const students = await User.find(query).select('-password').sort({ name: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// ─── GET ALL TEACHERS (Admin only) ──────────────────────────────────────────
router.get('/teachers', verifyToken, requireAdmin, async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('-password').sort({ name: 1 });
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// ─── UPDATE USER (Admin only) ────────────────────────────────────────────────
router.put('/users/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { password, ...updates } = req.body;
    if (password) {
      updates.password = await bcrypt.hash(password, 12);
    }
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ msg: 'User not found.' });
    res.json({ msg: 'Updated successfully.', user });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// ─── DELETE USER (Admin only) ────────────────────────────────────────────────
router.delete('/users/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found.' });
    res.json({ msg: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// ─── TOGGLE USER STATUS (Admin only) ────────────────────────────────────────
router.patch('/users/:id/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found.' });
    user.status = user.status === 'active' ? 'inactive' : 'active';
    await user.save();
    res.json({ msg: `User ${user.status}`, status: user.status });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// ─── SEED DEMO ACCOUNTS ──────────────────────────────────────────────────────
router.post('/seed', async (req, res) => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) return res.status(400).json({ msg: 'Demo accounts already seeded.' });

    const hash = (pw) => bcrypt.hash(pw, 12);
    const [adminPw, teacherPw, studentPw] = await Promise.all([
      hash('Admin@123'), hash('Teacher@123'), hash('Student@123'),
    ]);

    await User.insertMany([
      {
        role: 'admin', name: 'Dr. Ramesh Kumar',
        email: 'admin@college.com', password: adminPw,
        department: 'Computer Science', designation: 'Dean',
        employeeId: 'ADMIN001', status: 'active',
      },
      {
        role: 'teacher', name: 'Prof. Anita Sharma',
        email: 'teacher@college.com', password: teacherPw,
        department: 'Computer Science', designation: 'Assistant Professor',
        employeeId: 'TCH001', specialization: 'Data Structures',
        status: 'active',
      },
      {
        role: 'student', name: 'Rahul Verma',
        email: 'student@college.com', password: studentPw,
        enrollment: 'CS2024001', rollNumber: '001',
        department: 'Computer Science',
        semester: '3', section: 'A', year: '2nd Year',
        status: 'active',
      },
    ]);
    res.json({ msg: 'Demo accounts seeded!', accounts: [
      { role: 'admin',   email: 'admin@college.com',   password: 'Admin@123' },
      { role: 'teacher', email: 'teacher@college.com', password: 'Teacher@123' },
      { role: 'student', email: 'student@college.com', password: 'Student@123' },
    ]});
  } catch (err) {
    res.status(500).json({ msg: 'Seeding failed.', error: err.message });
  }
});

module.exports = router;
