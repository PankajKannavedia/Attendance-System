import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../src/models/User.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/attendanceDb";

const seedEmployees = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");

    const employees = [
      { employeeId: "EMP001", name: "Rajat", role: "Employee" },
      { employeeId: "EMP002", name: "Shiv", role: "Employee" },
      { employeeId: "EMP003", name: "Rahul", role: "Employee" },
    ];

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("a1234", salt);

    for (const emp of employees) {
      const existingUser = await User.findOne({ employeeId: emp.employeeId });
      if (!existingUser) {
        await User.create({
          employeeId: emp.employeeId,
          name: emp.name,
          password: hashedPassword,
          role: emp.role,
        });
        console.log(`Created user ${emp.employeeId}`);
      } else {
        // Update password if it already exists to ensure it's 'a1234'
        existingUser.password = hashedPassword;
        await existingUser.save();
        console.log(`Updated user ${emp.employeeId}`);
      }
    }

    console.log("Seeding Database Complete.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedEmployees();
