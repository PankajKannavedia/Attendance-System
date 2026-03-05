import mongoose, { Schema, Document } from 'mongoose';
const AttendanceSchema = new Schema({
    employeeId: { type: String, required: true },
    name: { type: String, required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    punchIn: {
        time: String,
        latitude: Number,
        longitude: Number,
        imageUrl: String,
        locationName: String,
        geofenceStatus: String
    },
    punchOut: {
        time: String,
        latitude: Number,
        longitude: Number,
        imageUrl: String,
        locationName: String,
        geofenceStatus: String
    },
    totalHours: { type: Number, default: 0 },
    dayStatus: { type: String, default: 'Present' }
}, { timestamps: true });
// Indexes for speed and optimization
AttendanceSchema.index({ employeeId: 1, date: -1 }); // Often queried by ID and date descending
AttendanceSchema.index({ date: 1 }); // Admin often queries ALL records by specific date
export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
//# sourceMappingURL=Attendance.js.map