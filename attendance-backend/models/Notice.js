const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['admin', 'teacher'], required: true },
  
  // Who can see this notice
  audience: { 
    type: String, 
    enum: ['teachers', 'students', 'both', 'specific_classes'], 
    required: true 
  },
  
  // For targeted notices (Teachers sending to classes)
  targetClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  targetSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  targetDepartments: [{ type: String }], // e.g. ['BCA', 'MCA']
  targetSemester: { type: String },
  targetSection: { type: String },

  title: { type: String, required: true },
  message: { type: String, required: true },
  
  priority: { 
    type: String, 
    enum: ['normal', 'important', 'urgent'], 
    default: 'normal' 
  },
  
  isPinned: { type: Boolean, default: false },
  attachments: [{
    name: String,
    url: String,
    type: String
  }],
  
  // To track unread status per user
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
}, { timestamps: true });

// Index for performance
noticeSchema.index({ audience: 1, createdAt: -1 });
noticeSchema.index({ targetClasses: 1 });

module.exports = mongoose.model('Notice', noticeSchema);
