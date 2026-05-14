const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = "mongodb+srv://user:123@cluster0.eo1lbv2.mongodb.net/attendx?retryWrites=true&w=majority&appName=Cluster0";

async function resetTeacher() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const hashedPassword = await bcrypt.hash("teacher123", 12);
  
  await db.collection("users").updateMany(
    { role: "teacher" },
    { $set: { password: hashedPassword } }
  );
  
  console.log("All teacher passwords reset to: teacher123");
  process.exit(0);
}

resetTeacher().catch(err => {
  console.error(err);
  process.exit(1);
});
