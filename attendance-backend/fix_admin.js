const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = "mongodb+srv://user:123@cluster0.eo1lbv2.mongodb.net/attendx?retryWrites=true&w=majority&appName=Cluster0";

async function fixAdmin() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  
  const hashedPassword = await bcrypt.hash("Admin@123", 12);
  
  await db.collection("users").updateOne(
    { role: "admin" },
    { $set: { email: "admin@college.com", password: hashedPassword } }
  );
  
  console.log("Admin fixed! Email is admin@college.com and password is Admin@123");
  process.exit(0);
}

fixAdmin().catch(err => {
  console.error(err);
  process.exit(1);
});
