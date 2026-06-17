import { Router } from "express";
import { jobController } from "../controllers/job.controller.js";

const router = Router();

router.post("/", jobController.create);
router.get("/:id", jobController.getById);

export default router;