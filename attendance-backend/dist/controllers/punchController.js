import Location from "../models/Location.js";
import Attendance from "../models/Attendance.js";
import { uploadToDrive } from "../services/driveService.js";
// Helper: Calculate distance between two coordinates (Haversine Formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const p1 = (lat1 * Math.PI) / 180;
    const p2 = (lat2 * Math.PI) / 180;
    const dp = ((lat2 - lat1) * Math.PI) / 180;
    const dl = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
        Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
export const punchAction = async (req, res) => {
    try {
        const { employeeId, name, action, latitude, longitude, imageBase64 } = req.body;
        const today = new Date().toISOString().split('T')[0];
        // 1. Check Geofence
        const locations = await Location.find({ employeeId });
        let inRange = false;
        let siteName = "N/A";
        for (const loc of locations) {
            const dist = calculateDistance(latitude, longitude, loc.latitude, loc.longitude);
            if (dist <= loc.radius) {
                inRange = true;
                siteName = loc.siteName;
                break;
            }
        }
        const geofenceStatus = inRange ? "In Range" : "Out of Range";
        if (!inRange && latitude && longitude) {
            siteName = `Unknown (Lat: ${Number(latitude).toFixed(3)}, Lng: ${Number(longitude).toFixed(3)})`;
        }
        // Instead of blocking with 403, we let the punch go through but flag it as "Out of Range".
        // Admin can review it later.
        // if (!inRange) {
        //   return res.status(403).json({ status: "error", message: "Out of Range: You must be within the geofenced area to punch." });
        // }
        if (!imageBase64) {
            return res.status(400).json({ status: "error", message: "Camera capture is required to punch." });
        }
        let imageUrl = "N/A";
        const fileName = `${employeeId}_${Date.now()}.jpg`;
        imageUrl = await uploadToDrive(imageBase64, fileName) || "N/A";
        // 2. Validate Duplicate Punches
        const existingRecord = await Attendance.findOne({ employeeId, date: today });
        if (action === "In") {
            if (existingRecord) {
                return res.status(400).json({ status: "error", message: "You have already punched in today." });
            }
            const newPunch = new Attendance({
                employeeId,
                name,
                date: today,
                punchIn: {
                    time: new Date().toLocaleTimeString('en-US', { hour12: false }),
                    latitude,
                    longitude,
                    imageUrl: imageUrl,
                    locationName: siteName,
                    geofenceStatus: geofenceStatus
                }
            });
            await newPunch.save();
        }
        else {
            if (!existingRecord) {
                return res.status(400).json({ status: "error", message: "Cannot punch out without a punch in record today." });
            }
            if (existingRecord.punchOut && existingRecord.punchOut.time) {
                return res.status(400).json({ status: "error", message: "You have already punched out for today." });
            }
            existingRecord.punchOut = {
                time: new Date().toLocaleTimeString('en-US', { hour12: false }),
                latitude,
                longitude,
                imageUrl: imageUrl,
                locationName: siteName,
                geofenceStatus: geofenceStatus
            };
            await existingRecord.save();
        }
        res.json({ status: "success", message: `Punch ${action} successful!` });
    }
    catch (error) {
        res.status(500).json({ status: "error", message: "Server Error" });
    }
};
//# sourceMappingURL=punchController.js.map