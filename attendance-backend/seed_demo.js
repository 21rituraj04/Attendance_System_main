const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Session = require("./models/Session");
const Attendance = require("./models/Attendance");

const MONGODB_URI = "mongodb+srv://user:123@cluster0.eo1lbv2.mongodb.net/attendx?retryWrites=true&w=majority&appName=Cluster0";

async function seedData() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    const hash = await bcrypt.hash("Teacher@123", 12);
    
    // 1. Add Teachers (clear existing demo teachers first)
    await User.deleteMany({ email: { $in: ["rajat.bca@college.com", "sneha.mca@college.com", "arvind.btech@college.com"] } });
    await Session.deleteMany({ subject: { $in: ["Data Structures", "Advanced Database"] } });
    await Attendance.deleteMany({ subject: { $in: ["Data Structures", "Advanced Database"] } });

    const teachers = await User.insertMany([
      { role: "teacher", name: "Prof. Rajat Gupta", email: "rajat.bca@college.com", password: hash, employeeId: "T-BCA01", department: "BCA", status: "active" },
      { role: "teacher", name: "Dr. Sneha Patil", email: "sneha.mca@college.com", password: hash, employeeId: "T-MCA01", department: "MCA", status: "active" },
      { role: "teacher", name: "Prof. Arvind Rao", email: "arvind.btech@college.com", password: hash, employeeId: "T-BTE01", department: "BTech", status: "active" }
    ]);
    
    console.log("Teachers added.");
    
    // Assign departments to existing students (just randomly assigning for demo)
    await User.updateMany({ role: "student", department: { $exists: false } }, { $set: { department: "BCA" } });
    await User.updateOne({ email: "aarav@student.attendx.local" }, { $set: { department: "BTech" } });
    await User.updateOne({ email: "priya@student.attendx.local" }, { $set: { department: "MCA" } });
    
    const students = await User.find({ role: "student" }).limit(5);

    // 2. Add Sessions
    const s1 = new Session({
      teacherId: teachers[0]._id,
      createdBy: teachers[0].name,
      subject: "Data Structures",
      semester: "3", section: "A",
      pin: "1234",
      status: "expired",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    });
    
    const s2 = new Session({
      teacherId: teachers[1]._id,
      createdBy: teachers[1].name,
      subject: "Advanced Database",
      semester: "1", section: "B",
      pin: "5678",
      status: "active",
      createdAt: new Date()
    });
    
    await s1.save();
    await s2.save();
    console.log("Sessions added.");
    
    // 3. Add Attendance
    const attendances = [];
    for (const student of students) {
      attendances.push({
        sessionId: s1._id,
        teacherId: teachers[0]._id,
        studentId: student._id,
        studentName: student.name,
        enrollment: student.enrollment,
        subject: "Data Structures",
        semester: "3",
        section: "A",
        method: "manual",
        markedAt: new Date()
      });
      attendances.push({
        sessionId: s2._id,
        teacherId: teachers[1]._id,
        studentId: student._id,
        studentName: student.name,
        enrollment: student.enrollment,
        subject: "Advanced Database",
        semester: "1",
        section: "B",
        method: "qr",
        markedAt: new Date()
      });
    }
    
    await Attendance.insertMany(attendances);
    console.log("Attendance added.");
    
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

seedData();
