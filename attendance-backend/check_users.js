const mongoose = require("mongoose");

const MONGODB_URI = "mongodb+srv://user:123@cluster0.eo1lbv2.mongodb.net/attendx?retryWrites=true&w=majority&appName=Cluster0";

async function checkUsers() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const users = await db.collection("users").find({}).toArray();
  console.log("Users in DB:");
  users.forEach(u => console.log(`- Role: ${u.role}, Email: ${u.email}, ID: ${u.employeeId || u.enrollment}, Dept: ${u.department}, Sem: ${u.semester}, Sec: ${u.section}`));
  process.exit(0);
}

checkUsers().catch(err => {
  console.error(err);
  process.exit(1);
});
