import Leave from "../models/Leave.js";
import EarlyLeave from "../models/EarlyLeave.js";
export const getLeaveApplications = async (req, res) => {
    try {
        const leaves = await Leave.find({});
        res.json(leaves);
    }
    catch (error) {
        res.status(500).json({ status: "error", message: "Error fetching leaves" });
    }
};
export const applyLeave = async (req, res) => {
    try {
        const { employeeId, employeeName, department, leaveType, fromDate, toDate, totalDays, reason } = req.body;
        const applicationId = `L-${Date.now()}`;
        const newLeave = new Leave({
            applicationId, employeeId, employeeName, department, leaveType, fromDate, toDate, totalDays, reason
        });
        await newLeave.save();
        res.json({ status: "success", message: "Leave applied successfully." });
    }
    catch (error) {
        res.status(500).json({ status: "error", message: "Failed to apply leave" });
    }
};
export const approveLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // "Approved" or "Rejected"
        await Leave.findOneAndUpdate({ applicationId: id }, { status });
        res.json({ status: "success", message: `Leave ${status} successfully.` });
    }
    catch (error) {
        res.status(500).json({ status: "error", message: "Action failed" });
    }
};
// Early Leave Methods
export const applyEarlyLeave = async (req, res) => {
    try {
        const { employeeId, employeeName, leaveDate, hoursRequested, reason } = req.body;
        const applicationId = `EL-${Date.now()}`;
        const newLeave = new EarlyLeave({
            applicationId, employeeId, employeeName, leaveDate, hoursRequested, reason
        });
        await newLeave.save();
        res.json({ status: "success", message: "Early Leave applied successfully." });
    }
    catch (error) {
        res.status(500).json({ status: "error", message: "Failed to apply early leave" });
    }
};
export const getPersonalLeaveApplications = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const leaves = await Leave.find({ employeeId: employeeId });
        res.json(leaves);
    }
    catch (error) {
        res.status(500).json({ status: "error", message: "Error fetching personal leaves" });
    }
};
export const getEarlyLeaveApplications = async (req, res) => {
    try {
        const leaves = await EarlyLeave.find({});
        res.json(leaves);
    }
    catch (error) {
        res.status(500).json({ status: "error", message: "Error fetching early leaves" });
    }
};
export const getPersonalEarlyLeaveApplications = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const leaves = await EarlyLeave.find({ employeeId: employeeId });
        res.json(leaves);
    }
    catch (error) {
        res.status(500).json({ status: "error", message: "Error fetching personal early leaves" });
    }
};
export const approveEarlyLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await EarlyLeave.findOneAndUpdate({ applicationId: id }, { status });
        res.json({ status: "success", message: `Early Leave ${status} successfully.` });
    }
    catch (error) {
        res.status(500).json({ status: "error", message: "Action failed" });
    }
};
//# sourceMappingURL=leaveController.js.map