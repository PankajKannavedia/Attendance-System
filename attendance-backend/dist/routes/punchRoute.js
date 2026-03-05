import express from "express";
import { punchAction } from "../controllers/punchController.js";
const router = express.Router();
router.post("/", punchAction);
export default router;
//# sourceMappingURL=punchRoute.js.map