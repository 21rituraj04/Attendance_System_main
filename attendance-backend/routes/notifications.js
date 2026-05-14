const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// ─── GET NOTIFICATIONS ───────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });
    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── MARK AS READ ────────────────────────────────────────────────────────
router.patch('/:id/read', async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true }
    );
    res.json({ msg: 'Marked as read.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── MARK ALL AS READ ────────────────────────────────────────────────────
router.patch('/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.json({ msg: 'All marked as read.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
