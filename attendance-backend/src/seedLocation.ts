import mongoose from "mongoose";
import dotenv from "dotenv";
import Location from "./models/Location.js";

dotenv.config();

const seedLocation = async () => {
  try {
    // 1. Connect to DB
    await mongoose.connect(process.env.MONGO_URI || "");
    console.log("Database connected for location seeding...");

    // 2. Clear existing locations for this test
    await Location.deleteMany({ employeeId: "ADMIN001" });

    // 3. Create a Test Location for your User
    // TIP: Put your current Home/Office coordinates here to test "In Range"
    const testLocation = new Location({
      employeeId: "ADMIN001",
      siteName: "Head Office",
      latitude: 23.15359610471099, // Example: Delhi coords
      longitude: 77.41108129989014,
      radius: 300 // GEOFENCE_RADIUS_METERS from your script
    });

    await testLocation.save();
    console.log("Geofence location assigned to ADMIN001 successfully!");

    await mongoose.connection.close();
    process.exit();
  } catch (error) {
    console.error("Error seeding location:", error);
    process.exit(1);
  }
};

seedLocation();