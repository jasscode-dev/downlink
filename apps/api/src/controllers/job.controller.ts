import type { Request, Response } from "express";
import { createJobSchema } from "@video-converter/shared/schemas/createJob.schema.js";
import { jobService } from "../services/job.service.js";


export class JobController {
    async create(req: Request, res: Response) {
        const parsed = createJobSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.flatten() });
        }

        const job = await jobService.createJob(parsed.data);
        return res.status(201).json({ job });
    }

    async getById(req: Request, res: Response) {
        const { id } = req.params;
        const job = await jobService.getJob(id);

        if (!job) {
            return res.status(404).json({ error: "Job não encontrado" });
        }

        return res.json({ job });
    }
}

export const jobController = new JobController();
