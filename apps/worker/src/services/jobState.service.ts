import { redisConnection } from "../config/redis.js";
import type { JobRecord, JobStatus } from "@video-converter/shared";

const jobKey = (id: string) => `job:${id}`;

export class JobStateService {
  async getJob(id: string): Promise<JobRecord | null> {
    const raw = await redisConnection.get(jobKey(id));
    return raw ? (JSON.parse(raw) as JobRecord) : null;
  }

  async update(id: string, patch: Partial<JobRecord>): Promise<void> {
    const current = await this.getJob(id);
    if (!current) return;

    const updated: JobRecord = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    await redisConnection.set(jobKey(id), JSON.stringify(updated));
  }

  async setStatus(id: string, status: JobStatus, progress?: number): Promise<void> {
    await this.update(id, { status, ...(progress !== undefined ? { progress } : {}) });
  }
}

export const jobStateService = new JobStateService();
