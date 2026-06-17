import { randomUUID } from "node:crypto";
import { redisConnection } from "../config/redis.js";
import { CreateJobInput, JobRecord } from "@video-converter/shared/types/job.js";
import { videoQueue } from "../queue/video.queue.js";

const jobKey = (id: string) => `job:${id}`;

export class JobService {
    async createJob(input: CreateJobInput): Promise<JobRecord> {
        const id = randomUUID();
        const now = new Date().toISOString();

        const record: JobRecord = {
            id,
            url: input.url,
            outputFormat: input.outputFormat,
            status: "queued",
            progress: 0,
            createdAt: now,
            updatedAt: now,
        };

        await redisConnection.set(jobKey(id), JSON.stringify(record));

        await videoQueue.add("convert", input, { jobId: id });

        return record;
    }

    async getJob(id: string): Promise<JobRecord | null> {
        const raw = await redisConnection.get(jobKey(id));
        if (!raw) return null;
        return JSON.parse(raw) as JobRecord;
    }
}

export const jobService = new JobService();
