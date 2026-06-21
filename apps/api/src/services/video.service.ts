import { randomUUID } from "node:crypto";
import { redisConnection } from "../config/redis.js";
import { VideoInput, VideoRecord } from "@video-converter/shared/types/video.js";
import { videoQueue } from "../queue/video.queue.js";
import { AppError } from "../errors/appError.js";
import { getVideoInfo } from "@video-converter/worker/src/services/ytdlp.service.js";

const videoKey = (id: string) => `video:${id}`;

export class VideoService {
    async processVideo(input: VideoInput): Promise<VideoRecord> {
        let info;
        try {
            info = await getVideoInfo(input.url);
        } catch (error) {
            throw new AppError("Could not access this video. It might be unavailable, private, or the link is incorrect.", 400);
        }

        const MAX_DURATION_SECONDS = 600;
        const MAX_GIF_SECONDS = 120;

        if (info.duration && info.duration > MAX_DURATION_SECONDS) {
            throw new AppError(`Video duration is too long! Limit is ${MAX_DURATION_SECONDS / 60} minutes!`, 400);
        }

        if (info.duration && info.duration > MAX_GIF_SECONDS && input.outputFormat === "gif") {
            throw new AppError(`Video duration is too long for GIF! Limit is ${MAX_GIF_SECONDS / 60} minutes!`, 400);
        }

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

    async getVideo(id: string): Promise<VideoRecord> {
        const raw = await redisConnection.get(videoKey(id));
        if (!raw) throw new AppError("Video not found!", 404);
        return JSON.parse(raw) as VideoRecord;
    }




}

export const videoService = new VideoService();
