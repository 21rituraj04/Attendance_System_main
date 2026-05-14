const mongoose = require("mongoose");
const Class = require("./models/Class");
const Department = require("./models/Department");

const MONGODB_URI = "mongodb+srv://user:123@cluster0.eo1lbv2.mongodb.net/attendx?retryWrites=true&w=majority&appName=Cluster0";

async function seedClasses() {
  try {
    await mongoose.connect(MONGODB_URI);
    
    // Clear existing classes
    await Class.deleteMany({});
    
    const classes = [
      { name: "BCA - Sem 3 - A", semester: "3", section: "A", departmentName: "BCA", status: "active" },
      { name: "BCA - Sem 1 - B", semester: "1", section: "B", departmentName: "BCA", status: "active" },
      { name: "MCA - Sem 1 - B", semester: "1", section: "B", departmentName: "MCA", status: "active" },
      { name: "BTech - Sem 5 - C", semester: "5", section: "C", departmentName: "BTech", status: "active" }
    ];

    await Class.insertMany(classes);
    console.log("Classes seeded successfully.");
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}

seedClasses();
