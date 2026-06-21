import { Worker } from "bullmq";
import { redisConnection } from "./config/redis.js";
import { videoConversionProcessor } from "./processors/videoConversion.processor.js";

import { startCleanupJob } from "./services/cleanup.service.js";

const VIDEO_QUEUE_NAME = "video-conversion";

const worker = new Worker(VIDEO_QUEUE_NAME, videoConversionProcessor, {
  connection: redisConnection as any,
  concurrency: 2,
});

worker.on("completed", (job) => {
  console.log(`[worker] Job ${job.id} concluído com sucesso`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] Job ${job?.id} falhou: ${err.message}`);
});

startCleanupJob();

console.log("Worker escutando a fila de conversão de vídeo...");
