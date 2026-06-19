import { randomUUID } from "node:crypto";
import { redisConnection } from "../config/redis.js";
import { VideoInput, VideoRecord } from "@video-converter/shared/types/video.js";
import { videoQueue } from "../queue/video.queue.js";

const videoKey = (id: string) => `video:${id}`;

export class VideoService {
    async processVideo(input: VideoInput): Promise<VideoRecord> {
        const id = randomUUID();
        const now = new Date().toISOString();

        const record: VideoRecord = {
            id,
            url: input.url,
            outputFormat: input.outputFormat,
            status: "queued",
            progress: 0,
            createdAt: now,
            updatedAt: now,
        };

        await redisConnection.set(videoKey(id), JSON.stringify(record));

        await videoQueue.add("convert", input, { jobId: id });

        return record;
    }

    async getVideo(id: string): Promise<VideoRecord | null> {
        const raw = await redisConnection.get(videoKey(id));
        if (!raw) return null;
        return JSON.parse(raw) as VideoRecord;
    }
}

export const videoService = new VideoService();
