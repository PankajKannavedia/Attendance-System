import mongoose, { Schema, Document } from "mongoose";
const UserSchema = new Schema({
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["Admin", "Employee"], default: "Employee" },
    department: { type: String },
    monthlySalary: { type: Number, default: 0 },
}, {
    timestamps: true,
});
// Indexes for speed and optimization
UserSchema.index({ employeeId: 1 });
UserSchema.index({ role: 1 });
export default mongoose.model("User", UserSchema);
//# sourceMappingURL=User.js.map