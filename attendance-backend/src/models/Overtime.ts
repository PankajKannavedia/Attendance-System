import mongoose from "mongoose";

const overtimeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  otDate: { type: String, required: true },
  approved: { type: String, required: true } // "Approved" or "Not Approved"
});

export default mongoose.model("Overtime", overtimeSchema);
