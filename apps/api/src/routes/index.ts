import { Router } from "express";
import jobRoutes from "./job.routes.js";

const router = Router();
router.use("/jobs", jobRoutes);

export default router;