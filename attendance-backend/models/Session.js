const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  subject:      { type: String, required: true },
  subjectId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  semester:     { type: String, required: true },
  section:      { type: String, required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  departmentName: { type: String },
  classId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  pin:          { type: String, required: true },
  status:       { type: String, enum: ['active', 'locked', 'expired'], default: 'active' },
  expireAt:     { type: Date },
  autoExpire:   { type: Boolean, default: false },
  expireMinutes:{ type: Number, default: 30 },
  createdBy:    { type: String, required: true },
  // New: scoped to teacher, visible to admin
  teacherId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attendeeCount:{ type: Number, default: 0 },
}, { timestamps: true });

sessionSchema.index({ teacherId: 1, status: 1 });
sessionSchema.index({ pin: 1 });
sessionSchema.index({ semester: 1, section: 1, status: 1 });

module.exports = mongoose.model('Session', sessionSchema);
