import type { Request, Response } from "express";
import bcrypt from "bcryptjs"; // Import bcryptjs
import User from "../models/User.js";

export const login = async (req: Request, res: Response) => {
  try {
    const { employeeId, password } = req.body;

    // 1. Find user by employeeId
    const user = await User.findOne({ employeeId });

    if (!user) {
      return res.status(401).json({ 
        status: "error", 
        message: "Invalid Employee ID" 
      });
    }

    // 2. Compare entered password with hashed password in DB
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ 
        status: "error", 
        message: "Invalid Password" 
      });
    }

    // 3. Success response
    res.json({
      status: "success",
      user: {
        employeeId: user.employeeId,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Server Error" });
  }
};