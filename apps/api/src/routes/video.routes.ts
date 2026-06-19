import { Router } from "express";
import { videoController } from "../controllers/video.controller.js";

const router = Router();

router.post("/", videoController.create.bind(videoController));
router.get("/info", videoController.getInfo.bind(videoController));
router.get("/:id", videoController.getById.bind(videoController));
router.get("/:id/download", videoController.download.bind(videoController));

export default router;