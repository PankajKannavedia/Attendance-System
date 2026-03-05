import mongoose, { Document } from 'mongoose';
export interface IAttendance extends Document {
    employeeId: string;
    name: string;
    date: string;
    punchIn?: {
        time: string;
        latitude: number;
        longitude: number;
        imageUrl: string;
        locationName: string;
        geofenceStatus: string;
    };
    punchOut?: {
        time: string;
        latitude: number;
        longitude: number;
        imageUrl: string;
        locationName: string;
        geofenceStatus: string;
    };
    totalHours?: number;
    dayStatus?: string;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any, any>;
export default _default;
//# sourceMappingURL=Attendance.d.ts.map