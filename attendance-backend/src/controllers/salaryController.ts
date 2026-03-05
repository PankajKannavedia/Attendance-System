import type { Request, Response } from "express";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Leave from "../models/Leave.js";
import EarlyLeave from "../models/EarlyLeave.js";
import { calculatePaidHolidayUnits, getTotalDaysInRange } from "../utils/dateUtils.js";

// Helper to calculate total leave units consumed by an employee within a date range
const calculateLeaveConsumption = async (employeeId: string, startDate: string, endDate: string) => {
  const fullLeaves = await Leave.find({ employeeId, status: "Approved" });
  const earlyLeaves = await EarlyLeave.find({ employeeId, status: "Approved" });

  let unitsConsumed = 0;

  fullLeaves.forEach(leave => {
    if ((leave.fromDate >= startDate && leave.fromDate <= endDate) || 
        (leave.toDate >= startDate && leave.toDate <= endDate)) {
      unitsConsumed += (leave.totalDays || 1);
    }
  });

  earlyLeaves.forEach(eleave => {
    if (eleave.leaveDate >= startDate && eleave.leaveDate <= endDate) {
      if (eleave.hoursRequested > 2) {
        unitsConsumed += 0.5; // Half day deduction if > 2 hrs
      } else {
        unitsConsumed += 0.25; // 0.25 deduction if <= 2 hrs
      }
    }
  });

  return unitsConsumed;
};

export const getSalaryDetails = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query as { startDate: string, endDate: string };
    
    const user = await User.findOne({ employeeId: employeeId as string });
    if (!user) return res.status(404).json({ message: `No user found for ID: ${employeeId}` });

    const records = await Attendance.find({
      employeeId: employeeId as string,
      date: { $gte: startDate, $lte: endDate }
    });

    const presentDays = records.length;
    const salary = user.monthlySalary || 0;
    
    const totalDaysInMonth = getTotalDaysInRange(startDate, endDate);
    const paidHolidayUnits = calculatePaidHolidayUnits(startDate, endDate);
    const leaveUnitsConsumed = await calculateLeaveConsumption(user.employeeId, startDate, endDate);
    
    const MAX_PAID_LEAVES = 2.75;
    const unpaidLeaveOverdraft = Math.max(0, leaveUnitsConsumed - MAX_PAID_LEAVES);
    const paidLeavesTaken = leaveUnitsConsumed - unpaidLeaveOverdraft;
    
    const totalPaidDays = Math.min(totalDaysInMonth, paidHolidayUnits + presentDays + paidLeavesTaken);
    const payableAmount = Math.round((salary / totalDaysInMonth) * totalPaidDays);
    const actualAbsentDays = totalDaysInMonth - presentDays - paidHolidayUnits;
    
    res.json({
      status: "success",
      employeeName: user.name,
      totalNoOfDays: totalDaysInMonth,
      noOfSunday: Math.floor(paidHolidayUnits), 
      presentDays,
      absentDays: Math.max(0, actualAbsentDays),
      holidays: paidHolidayUnits,
      noOfLateDays: 0,
      plannedWorkingHours: `${totalDaysInMonth * 8}:00:00`,
      actualWorkingHours: `${presentDays * 8}:00:00`,
      overtime: "0:00:00",
      otAmount: "₹0",
      monthlySalary: `₹${salary}`,
      penalty: `₹${Math.round((salary / totalDaysInMonth) * unpaidLeaveOverdraft)}`,
      advance: "₹0",
      payable: `₹${payableAmount}`,
      startDate,
      endDate
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Server Error" });
  }
};

export const getAllSalaries = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query as { startDate: string, endDate: string };
    
    if (!startDate || !endDate) {
      return res.status(400).json({ status: "error", message: "Start date and end date are required" });
    }

    const users = await User.find({});
    const allRecords = await Attendance.find({
      date: { $gte: startDate, $lte: endDate }
    } as any);

    const totalDaysInMonth = getTotalDaysInRange(startDate, endDate);
    const paidHolidayUnits = calculatePaidHolidayUnits(startDate, endDate);

    const results = await Promise.all(users.map(async (user) => {
      const presentDays = allRecords.filter(r => r.employeeId === user.employeeId).length;
      const salary = user.monthlySalary || 0;
      
      const leaveUnitsConsumed = await calculateLeaveConsumption(user.employeeId, startDate, endDate);
      const MAX_PAID_LEAVES = 2.75;
      const unpaidLeaveOverdraft = Math.max(0, leaveUnitsConsumed - MAX_PAID_LEAVES);
      
      const paidLeavesTaken = leaveUnitsConsumed - unpaidLeaveOverdraft;
      const totalPaidDays = Math.min(totalDaysInMonth, paidHolidayUnits + presentDays + paidLeavesTaken);
      
      const computedSalary = Math.round((salary / totalDaysInMonth) * totalPaidDays);
      const actualAbsentDays = totalDaysInMonth - presentDays - paidHolidayUnits;

      return {
        employeeId: user.employeeId,
        employeeName: user.name,
        presentDays,
        absentDays: Math.max(0, actualAbsentDays),
        monthlySalary: `₹${salary}`,
        payable: `₹${computedSalary}`
      };
    }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ status: "error", message: "Server Error" });
  }
};

export const getEmployeeList = async (req: Request, res: Response) => {
  try {
    const users = await User.find({}, "employeeId name");
    res.json(users);
  } catch (error) {
    res.status(500).json({ status: "error", message: "Error fetching employees" });
  }
};
