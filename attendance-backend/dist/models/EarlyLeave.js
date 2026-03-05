import mongoose from "mongoose";
const earlyLeaveSchema = new mongoose.Schema({
    applicationId: { type: String, required: true, unique: true },
    employeeId: { type: String, required: true },
    employeeName: { type: String, required: true },
    leaveDate: { type: String, required: true },
    hoursRequested: { type: Number, required: true },
    reason: { type: String, required: true },
    status: { type: String, default: "Pending" } // Pending, Approved, Rejected
});
export default mongoose.model("EarlyLeave", earlyLeaveSchema);
//# sourceMappingURL=EarlyLeave.js.map