import { Server } from "socket.io";
import { QueueEvents } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { VIDEO_QUEUE_NAME } from "../queue/video.queue.js";
import { videoService } from "../services/video.service.js";

export function setupVideoSockets(io: Server) {

    io.on("connection", (socket) => {
        socket.on("join", (videoId: string) => {
            socket.join(videoId);
        });

        socket.on("disconnect", () => {
        });
    });
    const queueEvents = new QueueEvents(VIDEO_QUEUE_NAME, {
        connection: redisConnection as any,
    });


    queueEvents.on("progress", async ({ jobId, data }) => {

        try {
            const videoData = await videoService.getVideo(jobId);
            io.to(jobId).emit("video-progress", {
                jobId,
                progress: data as number,
                status: videoData.status,
            });
        } catch (error) {
            console.error(`Erro ao buscar dados do vídeo no progress ${jobId}`, error);
        }
    });
    queueEvents.on("completed", async ({ jobId }) => {
        try {
            const videoData = await videoService.getVideo(jobId);
            io.to(jobId).emit("video-completed", videoData);
        } catch (error) {
            console.error(`Erro ao buscar dados do vídeo concluído ${jobId}`, error);
        }
    });


    queueEvents.on("failed", async ({ jobId, failedReason }) => {
        io.to(jobId).emit("video-failed", {
            jobId,
            error: failedReason,
        });
    });
}
