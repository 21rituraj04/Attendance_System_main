const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true },      // e.g. "CSE - Sem 3 - A"
  semester: { type: String, required: true },
  section: { type: String, required: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  departmentName: { type: String },
  teacherIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  studentIds:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  subjectIds:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  year: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

classSchema.index({ departmentId: 1, semester: 1, section: 1 });

module.exports = mongoose.model('Class', classSchema);
