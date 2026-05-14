const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true }, // e.g. "CSE", "ECE"
  description: { type: String },
  hodId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  hodName: { type: String },
  totalSemesters: { type: Number, default: 8 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
