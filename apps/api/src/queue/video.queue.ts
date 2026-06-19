import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";
import type { VideoInput } from "@video-converter/shared/types/video.js";


export const VIDEO_QUEUE_NAME = "video-conversion";

export const videoQueue = new Queue<VideoInput>(VIDEO_QUEUE_NAME, {
    connection: redisConnection as any,
    defaultJobOptions: {
        attempts: 2,
        backoff: { type: "exponential", delay: 5000 },
        removeOnComplete: { age: 3600 },
        removeOnFail: { age: 86400 },
    },
});