import express from "express";
import { getLeaveApplications, applyLeave, approveLeave, getPersonalLeaveApplications, applyEarlyLeave, getEarlyLeaveApplications, approveEarlyLeave, getPersonalEarlyLeaveApplications } from "../controllers/leaveController.js";
import { getPersonalRecords, getAllEmployeeRecords, getMonthlyRecords, approveOvertime, get30DaySummary } from "../controllers/recordsController.js";
import { getSalaryDetails, getEmployeeList, getAllSalaries } from "../controllers/salaryController.js";
const router = express.Router();
// Record endpoints
router.get("/records/personal/:employeeId", getPersonalRecords);
router.get("/records/admin/today", getAllEmployeeRecords);
router.get("/records/admin/monthly", getMonthlyRecords);
router.get("/records/summary/30-days", get30DaySummary);
// Leave endpoints
router.get("/leave/full", getLeaveApplications);
router.get("/leave/full/personal/:employeeId", getPersonalLeaveApplications);
router.post("/leave/full", applyLeave);
router.put("/leave/full/:id", approveLeave);
router.get("/leave/early", getEarlyLeaveApplications);
router.get("/leave/early/personal/:employeeId", getPersonalEarlyLeaveApplications);
router.post("/leave/early", applyEarlyLeave);
router.put("/leave/early/:id", approveEarlyLeave);
// Salary and Employee
router.get("/salary/all", getAllSalaries);
router.get("/salary/:employeeId", getSalaryDetails);
router.get("/employees", getEmployeeList);
// Overtime
router.put("/overtime", approveOvertime);
export default router;
//# sourceMappingURL=dataRoute.js.map