import express, { type Application, type Request, type Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js"; // MUST have .js extension
import authRoutes from "./routes/authRoute.js"; // MUST have .js extension
import punchRoute from "./routes/punchRoute.js";

dotenv.config();

// 1. Connect to Database
connectDB();

const app: Application = express();

// 2. Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

import path from "path";

// 3. Routes
app.use("/assets", express.static(path.join(process.cwd(), "assets")));
app.use("/api/auth", authRoutes); // Moved below the 'app' definition
app.use("/api/punch", punchRoute);

import dataRoutes from "./routes/dataRoute.js";
app.use("/api/data", dataRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Attendance System API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
