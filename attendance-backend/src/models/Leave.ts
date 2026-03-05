import mongoose from "mongoose";

const leaveApplicationSchema = new mongoose.Schema({
  applicationId: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  department: { type: String },
  leaveType: { type: String, required: true },
  fromDate: { type: String, required: true },
  toDate: { type: String, required: true },
  totalDays: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, default: "Pending" } // Pending, Approved, Rejected
});

export default mongoose.model("LeaveApplication", leaveApplicationSchema);
