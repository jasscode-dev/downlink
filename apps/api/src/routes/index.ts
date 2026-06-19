import { Router } from "express";
import jobRoutes from "./job.routes.js";
import infoRoutes from "./info.routes.js";

const router = Router();
router.use("/jobs", jobRoutes);
router.use("/info", infoRoutes);

export default router;