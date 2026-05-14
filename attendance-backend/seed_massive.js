const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Session = require("./models/Session");
const Attendance = require("./models/Attendance");
const Subject = require("./models/Subject");

const MONGODB_URI = "mongodb+srv://user:123@cluster0.eo1lbv2.mongodb.net/attendx?retryWrites=true&w=majority&appName=Cluster0";

async function seedMassive() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    // Wipe everything (except admin)
    await User.deleteMany({ role: { $in: ["student", "teacher"] } });
    await Session.deleteMany({});
    await Attendance.deleteMany({});
    await Subject.deleteMany({});
    
    const hash = await bcrypt.hash("Password@123", 12);
    
    // Add Subjects
    const subjects = await Subject.insertMany([
      { name: "Data Structures", semester: "3" },
      { name: "Operating Systems", semester: "3" },
      { name: "Java Programming", semester: "3" },
      { name: "Computer Networks", semester: "5" },
      { name: "Software Engineering", semester: "5" },
      { name: "Machine Learning", semester: "7" }
    ]);
    
    // Add Teachers
    const teachers = await User.insertMany([
      { role: "teacher", name: "Prof. Rajat Gupta", email: "rajat.bca@college.com", password: hash, employeeId: "T-BCA01", department: "BCA", status: "active" },
      { role: "teacher", name: "Dr. Sneha Patil", email: "sneha.mca@college.com", password: hash, employeeId: "T-MCA01", department: "MCA", status: "active" },
      { role: "teacher", name: "Prof. Arvind Rao", email: "arvind.btech@college.com", password: hash, employeeId: "T-BTE01", department: "BTech", status: "active" },
      { role: "teacher", name: "Dr. Kavita Verma", email: "kavita.btech@college.com", password: hash, employeeId: "T-BTE02", department: "BTech", status: "active" }
    ]);
    
    // Add 15 Students
    const students = await User.insertMany([
      // BCA Sem 3 Sec A
      { role: "student", name: "Aarav Sharma", email: "aarav@bca.college.com", password: hash, enrollment: "BCA2024001", department: "BCA", semester: "3", section: "A", status: "active" },
      { role: "student", name: "Priya Singh", email: "priya@bca.college.com", password: hash, enrollment: "BCA2024002", department: "BCA", semester: "3", section: "A", status: "active" },
      { role: "student", name: "Rahul Das", email: "rahul@bca.college.com", password: hash, enrollment: "BCA2024003", department: "BCA", semester: "3", section: "A", status: "active" },
      { role: "student", name: "Sneha Iyer", email: "sneha@bca.college.com", password: hash, enrollment: "BCA2024004", department: "BCA", semester: "3", section: "A", status: "active" },
      { role: "student", name: "Vikram G", email: "vikram@bca.college.com", password: hash, enrollment: "BCA2024005", department: "BCA", semester: "3", section: "A", status: "active" },
      
      // BTech Sem 5 Sec C
      { role: "student", name: "Rohan Verma", email: "rohan@btech.college.com", password: hash, enrollment: "BTE2024001", department: "BTech", semester: "5", section: "C", status: "active" },
      { role: "student", name: "Ananya K", email: "ananya@btech.college.com", password: hash, enrollment: "BTE2024002", department: "BTech", semester: "5", section: "C", status: "active" },
      { role: "student", name: "Kavya P", email: "kavya@btech.college.com", password: hash, enrollment: "BTE2024003", department: "BTech", semester: "5", section: "C", status: "active" },
      { role: "student", name: "Arjun Reddy", email: "arjun@btech.college.com", password: hash, enrollment: "BTE2024004", department: "BTech", semester: "5", section: "C", status: "active" },
      { role: "student", name: "Diya N", email: "diya@btech.college.com", password: hash, enrollment: "BTE2024005", department: "BTech", semester: "5", section: "C", status: "active" },

      // MCA Sem 1 Sec B
      { role: "student", name: "Zoya F", email: "zoya@mca.college.com", password: hash, enrollment: "MCA2024001", department: "MCA", semester: "1", section: "B", status: "active" },
      { role: "student", name: "Karan B", email: "karan@mca.college.com", password: hash, enrollment: "MCA2024002", department: "MCA", semester: "1", section: "B", status: "active" },
      { role: "student", name: "Simran O", email: "simran@mca.college.com", password: hash, enrollment: "MCA2024003", department: "MCA", semester: "1", section: "B", status: "active" },
      { role: "student", name: "Manish R", email: "manish@mca.college.com", password: hash, enrollment: "MCA2024004", department: "MCA", semester: "1", section: "B", status: "active" },
      { role: "student", name: "Pooja V", email: "pooja@mca.college.com", password: hash, enrollment: "MCA2024005", department: "MCA", semester: "1", section: "B", status: "active" },
    ]);

    // Add Sessions
    const s1 = new Session({
      teacherId: teachers[0]._id, createdBy: teachers[0].name,
      subject: "Data Structures", semester: "3", section: "A", pin: "1000", status: "expired",
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
    });
    const s2 = new Session({
      teacherId: teachers[0]._id, createdBy: teachers[0].name,
      subject: "Operating Systems", semester: "3", section: "A", pin: "1001", status: "active",
      createdAt: new Date()
    });
    const s3 = new Session({
      teacherId: teachers[2]._id, createdBy: teachers[2].name,
      subject: "Computer Networks", semester: "5", section: "C", pin: "2000", status: "active",
      createdAt: new Date()
    });
    const s4 = new Session({
      teacherId: teachers[1]._id, createdBy: teachers[1].name,
      subject: "Java Programming", semester: "1", section: "B", pin: "3000", status: "active",
      createdAt: new Date()
    });
    
    await s1.save(); await s2.save(); await s3.save(); await s4.save();

    // Add Attendances
    const bcaStudents = students.filter(s => s.department === "BCA");
    const btechStudents = students.filter(s => s.department === "BTech");
    const mcaStudents = students.filter(s => s.department === "MCA");
    
    const attendances = [];
    
    // s1 (completed) - 4/5 present
    bcaStudents.slice(0, 4).forEach(s => attendances.push({
      sessionId: s1._id, teacherId: teachers[0]._id, studentId: s._id,
      studentName: s.name, enrollment: s.enrollment, subject: "Data Structures",
      semester: "3", section: "A", method: "manual", markedAt: new Date(Date.now() - 23 * 60 * 60 * 1000)
    }));

    // s2 (active) - 3/5 present
    bcaStudents.slice(1, 4).forEach(s => attendances.push({
      sessionId: s2._id, teacherId: teachers[0]._id, studentId: s._id,
      studentName: s.name, enrollment: s.enrollment, subject: "Operating Systems",
      semester: "3", section: "A", method: "qr", markedAt: new Date()
    }));

    // s3 (active) - 2/5 present
    btechStudents.slice(0, 2).forEach(s => attendances.push({
      sessionId: s3._id, teacherId: teachers[2]._id, studentId: s._id,
      studentName: s.name, enrollment: s.enrollment, subject: "Computer Networks",
      semester: "5", section: "C", method: "qr", markedAt: new Date()
    }));

    // s4 (active) - 4/5 present
    mcaStudents.slice(0, 4).forEach(s => attendances.push({
      sessionId: s4._id, teacherId: teachers[1]._id, studentId: s._id,
      studentName: s.name, enrollment: s.enrollment, subject: "Java Programming",
      semester: "1", section: "B", method: "manual", markedAt: new Date()
    }));
    
    await Attendance.insertMany(attendances);

    // Update Session attendeeCounts
    await Session.updateOne({ _id: s1._id }, { attendeeCount: 4 });
    await Session.updateOne({ _id: s2._id }, { attendeeCount: 3 });
    await Session.updateOne({ _id: s3._id }, { attendeeCount: 2 });
    await Session.updateOne({ _id: s4._id }, { attendeeCount: 4 });
    
    console.log("Massive DB structure added!");
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

seedMassive();
