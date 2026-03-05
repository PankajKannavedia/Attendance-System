import mongoose, { Document } from 'mongoose';
export interface ILocation extends Document {
    employeeId: string;
    siteName: string;
    latitude: number;
    longitude: number;
    radius: number;
}
declare const _default: mongoose.Model<any, {}, {}, {}, any, any, any>;
export default _default;
//# sourceMappingURL=Location.d.ts.map