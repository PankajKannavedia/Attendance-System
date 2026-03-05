import Attendance from "../models/Attendance.js";
import Overtime from "../models/Overtime.js";
// Fetch Personal Records for a specific employee
export const getPersonalRecords = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const records = await Attendance.find({ employeeId }).sort({ date: -1 }).limit(30);
        // Map to match GAS output
        const formattedRecords = records.map(r => ({
            timestamp: r.createdAt,
            isToday: r.date === new Date().toISOString().split('T')[0],
            dateString: r.date,
            inTime: r.punchIn?.time || "",
            outTime: r.punchOut?.time || "",
            inLocation: r.punchIn?.locationName || "N/A",
            outLocation: r.punchOut?.locationName || "N/A",
            inImageUrl: r.punchIn?.imageUrl || "",
            outImageUrl: r.punchOut?.imageUrl || "",
            dayStatus: r.dayStatus || "Present",
            totalHours: r.totalHours?.toString() || "0.00"
        }));
        res.json(formattedRecords);
    }
    catch (error) {
        res.status(500).json({ status: "error", message: "Server Error" });
    }
};
// Fetch All Employee Records for Today (Admin View)
export const getAllEmployeeRecords = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const records = await Attendance.find({ date: today }).sort({ createdAt: -1 });
        const overtimes = await Overtime.find({ otDate: today });
        // Map to match GAS output
        const formattedRecords = records.map(r => {
            let action = "N/A";
            if (r.punchOut?.time)
                action = "Out";
            else if (r.punchIn?.time)
                action = "In";
            const overtimeRecord = overtimes.find(ot => ot.employeeId === r.employeeId);
            const overtimePermit = overtimeRecord ? overtimeRecord.approved : "Not Approved";
            return {
                employeeId: r.employeeId,
                name: r.name,
                inTime: r.punchIn?.time || "",
                outTime: r.punchOut?.time || "",
                inLatitude: r.punchIn?.latitude || "",
                inLongitude: r.punchIn?.longitude || "",
                outLatitude: r.punchOut?.latitude || "",
                outLongitude: r.punchOut?.longitude || "",
                inImageUrl: r.punchIn?.imageUrl || "N/A",
                outImageUrl: r.punchOut?.imageUrl || "N/A",
                inLocation: r.punchIn?.locationName || "N/A",
                outLocation: r.punchOut?.locationName || "N/A",
                inGeofenceStatus: r.punchIn?.geofenceStatus || "N/A",
                outGeofenceStatus: r.punchOut?.geofenceStatus || "N/A",
                dayStatus: r.dayStatus || "N/A",
                overtimePermit: overtimePermit,
                leaveApproved: "N/A", // Handled elsewhere
                totalHours: r.totalHours?.toString() || "0.00",
                action
            };
        });
        res.json(formattedRecords);
    }
    catch (error) {
        res.status(500).json({ status: "error", message: "Server Error" });
    }
};
// Fetch All Employee Records for a specific month (Admin View)
export const getMonthlyRecords = async (req, res) => {
    try {
        const { year, month } = req.query;
        if (!year || !month) {
            return res.status(400).json({ status: "error", message: "Year and month are required" });
        }
        const yearMonthStr = `${year}-${String(month).padStart(2, '0')}`;
        // Find records that start with the year-month string
        const records = await Attendance.find({
            date: { $regex: `^${yearMonthStr}` }
        }).sort({ date: -1, createdAt: -1 });
        const overtimes = await Overtime.find({
            otDate: { $regex: `^${yearMonthStr}` }
        });
        // Map to match GAS output format used by UI and Excel
        const formattedRecords = records.map(r => {
            const overtimeRecord = overtimes.find(ot => ot.employeeId === r.employeeId && ot.otDate === r.date);
            const overtimePermit = overtimeRecord ? overtimeRecord.approved : "Not Approved";
            return {
                employeeId: r.employeeId,
                name: r.name,
                dateString: r.date,
                inTime: r.punchIn?.time || "",
                outTime: r.punchOut?.time || "",
                inLocation: r.punchIn?.locationName || "N/A",
                outLocation: r.punchOut?.locationName || "N/A",
                totalHours: r.totalHours?.toString() || "0.00",
                dayStatus: r.dayStatus || "N/A",
                overtimePermit: overtimePermit
            };
        });
        res.json(formattedRecords);
    }
    catch (error) {
        res.status(500).json({ status: "error", message: "Server Error" });
    }
};
export const approveOvertime = async (req, res) => {
    try {
        const { employeeId, otDate, approved } = req.body;
        if (!employeeId || !otDate || !approved) {
            return res.status(400).json({ status: "error", message: "Missing required fields" });
        }
        let overtime = await Overtime.findOne({ employeeId, otDate });
        if (overtime) {
            overtime.approved = approved;
            await overtime.save();
        }
        else {
            overtime = new Overtime({ employeeId, otDate, approved });
            await overtime.save();
        }
        res.json({ status: "success", message: "Overtime status updated successfully" });
    }
    catch (error) {
        res.status(500).json({ status: "error", message: "Server Error" });
    }
};
export const get30DaySummary = async (req, res) => {
    try {
        const today = new Date();
        // Generate array of last 30 dates in YYYY-MM-DD
        const dateRange = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            dateRange.push(d.toISOString().split('T')[0]);
        }
        const startDate = dateRange[0];
        const endDate = dateRange[29];
        // Find all records in range
        const records = await Attendance.find({
            date: { $gte: startDate, $lte: endDate }
        });
        // Group by employeeId
        const employeeData = {};
        // We assume 30 days. We initialize all with Absent or not marked yet.
        // For simplicity, we just mark records where they show up as Present.
        records.forEach(r => {
            if (!employeeData[r.employeeId]) {
                employeeData[r.employeeId] = {
                    employeeId: r.employeeId,
                    name: r.name,
                    attendance: {},
                    presentCount: 0,
                    absentCount: 0
                };
                // Initialize all dates with 'A'
                dateRange.forEach(d => employeeData[r.employeeId].attendance[d] = 'A');
            }
            employeeData[r.employeeId].attendance[r.date] = 'P';
        });
        // Calculate totals
        const result = Object.values(employeeData).map(emp => {
            let present = 0;
            let absent = 0;
            dateRange.forEach(d => {
                if (emp.attendance[d] === 'P')
                    present++;
                else
                    absent++;
            });
            emp.presentCount = present;
            emp.absentCount = absent;
            return emp;
        });
        res.json({
            dates: dateRange,
            employees: result
        });
    }
    catch (error) {
        res.status(500).json({ status: "error", message: "Server Error" });
    }
};
//# sourceMappingURL=recordsController.js.map