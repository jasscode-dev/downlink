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

        return res.json({
            job:
            {
                ...job,
                outputFilePath: undefined,
                downloadUrl: job.status === "completed" ?
                    `api/jobs/${job.id}/download` : null,
            }
        });
    }

    async download(req: Request, res: Response) {
        const { id } = req.params;
        const job = await jobService.getJob(id);

        if (!job) {
            return res.status(404).json({ error: "Job não encontrado" });
        }

        if (job.status !== "completed" || !job.outputFilePath) {
            return res.status(400).json({ error: "O vídeo ainda não está pronto para download." });
        }

        const fs = await import("fs");
        if (!fs.existsSync(job.outputFilePath)) {
            return res.status(404).json({ error: "Arquivo não encontrado no servidor." });
        }

        return res.download(job.outputFilePath);
    }
}

export const jobController = new JobController();
