const express = require('express');
const router = express.Router();
const Notice = require('../models/Notice');
const Class = require('../models/Class');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// ─── GET NOTICES (Targeted) ───────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { role, _id, department, classes } = req.user;
    let query = {};

    if (role === 'admin') {
      // Admins see everything they sent + global notices they sent
      query = { 
        senderId: _id 
      };
    } else if (role === 'teacher') {
      // Teachers see notices for teachers, both, and their own
      query = {
        $or: [
          { senderId: _id },
          { audience: 'teachers' },
          { audience: 'both' }
        ]
      };
    } else if (role === 'student') {
      // Students see:
      // 1. Global student notices (no semester/section target)
      // 2. Notices for 'both' (teachers & students)
      // 3. Targeted student notices matching their sem/sec
      query = {
        $or: [
          { audience: 'both' },
          { 
            audience: 'students',
            $and: [
              { $or: [ { targetSemester: { $exists: false } }, { targetSemester: req.user.semester } ] },
              { $or: [ { targetSection: { $exists: false } }, { targetSection: req.user.section } ] }
            ]
          },
          { 
            audience: 'specific_classes',
            $and: [
              { $or: [ { targetSemester: { $exists: false } }, { targetSemester: req.user.semester } ] },
              { $or: [ { targetSection: { $exists: false } }, { targetSection: req.user.section } ] }
            ]
          }
        ]
      };
    }

    const notices = await Notice.find(query)
      .populate('senderId', 'name')
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(100);

    // Add 'unread' flag for the current user
    const formatted = notices.map(n => ({
      ...n.toObject(),
      isUnread: !n.readBy.includes(_id)
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET UNREAD COUNT ────────────────────────────────────────────────────
router.get('/unread-count', async (req, res) => {
  try {
    const { role, _id, department } = req.user;
    let query = {};

    if (role === 'admin') {
      query = { senderId: _id };
    } else if (role === 'teacher') {
      query = { $or: [{ senderId: _id }, { audience: 'teachers' }, { audience: 'both' }] };
    } else if (role === 'student') {
      query = {
        $or: [
          { audience: 'both' },
          { 
            audience: 'students',
            $and: [
              { $or: [ { targetSemester: { $exists: false } }, { targetSemester: req.user.semester } ] },
              { $or: [ { targetSection: { $exists: false } }, { targetSection: req.user.section } ] }
            ]
          },
          { 
            audience: 'specific_classes',
            $and: [
              { $or: [ { targetSemester: { $exists: false } }, { targetSemester: req.user.semester } ] },
              { $or: [ { targetSection: { $exists: false } }, { targetSection: req.user.section } ] }
            ]
          }
        ]
      };
    }

    const count = await Notice.countDocuments({ ...query, readBy: { $ne: _id } });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── CREATE NOTICE ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { role, _id } = req.user;
    if (role !== 'admin' && role !== 'teacher') {
      return res.status(403).json({ msg: 'Not authorized to send notices' });
    }

    const { 
      title, message, audience, priority, 
      isPinned, targetClasses, targetSubjects,
      targetSemester, targetSection
    } = req.body;

    const notice = new Notice({
      senderId: _id,
      senderRole: role,
      title,
      message,
      audience,
      priority,
      isPinned,
      targetClasses,
      targetSubjects,
      targetSemester,
      targetSection,
      readBy: [_id] // Mark as read by sender
    });

    await notice.save();
    res.status(201).json(notice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── MARK AS READ ────────────────────────────────────────────────────────
router.patch('/:id/read', async (req, res) => {
  try {
    await Notice.findByIdAndUpdate(req.params.id, {
      $addToSet: { readBy: req.user._id }
    });
    res.json({ msg: 'Notice marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── EDIT NOTICE ──────────────────────────────────────────────────────────
router.patch('/:id', async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ msg: 'Notice not found' });

    // Only sender can edit
    if (notice.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Unauthorized. Only the sender can edit this notice.' });
    }

    const updates = req.body;
    // Don't allow changing sender
    delete updates.senderId;
    delete updates.senderRole;

    const updated = await Notice.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── DELETE NOTICE ────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ msg: 'Notice not found' });

    // Only sender can delete. Admin cannot delete teacher notices.
    if (notice.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: 'Unauthorized. Only the sender can delete this notice.' });
    }

    await Notice.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Notice deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
