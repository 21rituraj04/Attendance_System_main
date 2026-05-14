const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String },
  semester: { type: String },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  departmentName: { type: String },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  teacherName: { type: String },
  credits: { type: Number, default: 3 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

subjectSchema.index({ departmentId: 1, semester: 1 });
subjectSchema.index({ teacherId: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
