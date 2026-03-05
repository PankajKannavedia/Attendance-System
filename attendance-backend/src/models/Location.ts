import mongoose, { Schema, Document } from 'mongoose';

export interface ILocation extends Document {
  employeeId: string;
  siteName: string;
  latitude: number;
  longitude: number;
  radius: number; // Defaults to 300 meters as per your GS code
}

const LocationSchema: Schema = new Schema({
  employeeId: { type: String, required: true },
  siteName: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  radius: { type: Number, default: 300 } 
});

export default mongoose.models.Location || mongoose.model<ILocation>('Location', LocationSchema);