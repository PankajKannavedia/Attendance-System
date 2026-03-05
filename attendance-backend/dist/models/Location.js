import mongoose, { Schema, Document } from 'mongoose';
const LocationSchema = new Schema({
    employeeId: { type: String, required: true },
    siteName: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    radius: { type: Number, default: 300 }
});
export default mongoose.models.Location || mongoose.model('Location', LocationSchema);
//# sourceMappingURL=Location.js.map