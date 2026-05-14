const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const Session = require("./models/Session");
const Attendance = require("./models/Attendance");

const MONGODB_URI = "mongodb+srv://user:123@cluster0.eo1lbv2.mongodb.net/attendx?retryWrites=true&w=majority&appName=Cluster0";

async function reseed() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    // 1. Wipe out existing data
    await User.deleteMany({ role: { $in: ["student", "teacher"] } });
    await Session.deleteMany({});
    await Attendance.deleteMany({});
    
    const hash = await bcrypt.hash("Password@123", 12);
    
    // Update existing admin to be Dean of FOCT
    await User.updateOne({ role: "admin" }, {
      $set: {
        name: "Dr. Ramesh Kumar",
        department: "FOCT", // Faculty of Computer Technology
        designation: "Dean of FOCT"
      }
    });

    // 2. Add Teachers under FOCT's sub-departments (BCA, MCA, BTech)
    const teachers = await User.insertMany([
      { role: "teacher", name: "Prof. Rajat Gupta", email: "rajat.bca@college.com", password: hash, employeeId: "T-BCA01", department: "BCA", status: "active" },
      { role: "teacher", name: "Dr. Sneha Patil", email: "sneha.mca@college.com", password: hash, employeeId: "T-MCA01", department: "MCA", status: "active" },
      { role: "teacher", name: "Prof. Arvind Rao", email: "arvind.btech@college.com", password: hash, employeeId: "T-BTE01", department: "BTech", status: "active" }
    ]);
    
    // 3. Add Students properly under BCA, MCA, BTech
    const students = await User.insertMany([
      // BCA Students
      { role: "student", name: "Aarav Sharma", email: "aarav@bca.college.com", password: hash, enrollment: "BCA2024001", department: "BCA", semester: "1", section: "A", status: "active" },
      { role: "student", name: "Priya Singh", email: "priya@bca.college.com", password: hash, enrollment: "BCA2024002", department: "BCA", semester: "1", section: "A", status: "active" },
      // MCA Students
      { role: "student", name: "Rohan Verma", email: "rohan@mca.college.com", password: hash, enrollment: "MCA2024001", department: "MCA", semester: "3", section: "B", status: "active" },
      { role: "student", name: "Ananya Iyer", email: "ananya@mca.college.com", password: hash, enrollment: "MCA2024002", department: "MCA", semester: "3", section: "B", status: "active" },
      // BTech Students
      { role: "student", name: "Vikram Das", email: "vikram@btech.college.com", password: hash, enrollment: "BTE2024001", department: "BTech", semester: "5", section: "C", status: "active" },
      { role: "student", name: "Sneha Reddy", email: "sneha@btech.college.com", password: hash, enrollment: "BTE2024002", department: "BTech", semester: "5", section: "C", status: "active" }
    ]);

    console.log("Database successfully cleaned and reseeded with FOCT -> BCA, MCA, BTech hierarchy.");
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

reseed();
