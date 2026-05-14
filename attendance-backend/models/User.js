const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  role: { type: String, enum: ['admin', 'teacher', 'student'], required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  phone: { type: String },
  avatar: { type: String },

  // Teacher fields
  employeeId: { type: String },
  designation: { type: String }, // e.g. "Assistant Professor"
  qualification: { type: String },
  specialization: { type: String },

  // Student fields
  enrollment: { type: String },
  rollNumber: { type: String },
  semester: { type: String },
  section: { type: String },
  year: { type: String },

  // Shared
  department: { type: String },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },

  // Relationships
  assignedSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  assignedClasses:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],

  // Password reset
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },

}, { timestamps: true });

userSchema.index({ enrollment: 1 });
userSchema.index({ employeeId: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ departmentId: 1, role: 1 });

module.exports = mongoose.model('User', userSchema);
