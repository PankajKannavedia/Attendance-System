import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import bcrypt from "bcryptjs";

dotenv.config();

const seedUser = async () => {
  try {
    // 1. Connect to DB
    await mongoose.connect(process.env.MONGO_URI || "");
    console.log("Database connected for seeding...");

    // 2. Clear existing users (Optional - prevents duplicates)
    await User.deleteMany({});

    // 1. Hash the password before saving
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash("password123", saltRounds);

    // 3. Create a Test Admin User
    const adminUser = new User({
      employeeId: "ADMIN001",
      name: "Pankaj Admin",
      password: hashedPassword, // Store the hashed version
      role: "Admin",
      department: "IT",
      monthlySalary: 50000
    });

    await adminUser.save();
    console.log("Test Admin user created successfully!");

    // 4. Close connection
    await mongoose.connection.close();
    process.exit();
  } catch (error) {
    console.error("Error seeding user:", error);
    process.exit(1);
  }
};

seedUser();