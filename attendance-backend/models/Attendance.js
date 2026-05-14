const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  sessionId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  teacherId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  enrollment:  { type: String, required: true },
  studentName: { type: String, required: true },
  subject:     { type: String, required: true },
  subjectId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
  semester:    { type: String, required: true },
  section:     { type: String, required: true },
  departmentId:{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  method:      { type: String, enum: ['pin', 'qr', 'qr-pin', 'manual'], required: true },
  fingerprint: { type: String },
  markedAt:    { type: Date, default: Date.now },
});

attendanceSchema.index({ teacherId: 1, markedAt: -1 });
attendanceSchema.index({ enrollment: 1, sessionId: 1 }, { unique: true });
attendanceSchema.index({ enrollment: 1, markedAt: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
