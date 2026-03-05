import express from "express";
import { login } from "../controllers/authController.js";
const router = express.Router();
// This defines the path: /api/auth/login
router.post("/login", login);
export default router;
//# sourceMappingURL=authRoute.js.map