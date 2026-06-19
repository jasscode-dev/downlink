import type { Job } from "bullmq";
import type { VideoInput } from "@video-converter/shared/types/video.js";
import { videoStateService } from "../services/videoState.service.js";
import { downloadVideo } from "../services/ytdlp.service.js";
import { convertVideo, getVideoDuration } from "../services/ffmpeg.service.js";

export async function videoConversionProcessor(job: Job<VideoInput>) {
  const videoId = job.id!;
  const { url, outputFormat } = job.data;

  try {

    const hasConversion = !!outputFormat && outputFormat !== "mp4";

    await videoStateService.setStatus(videoId, "downloading", 0);

    const { filePath } = await downloadVideo(url, videoId, (percent) => {
      const globalPercent = hasConversion ? Math.round(percent / 2) : percent;
      videoStateService.setStatus(videoId, "downloading", globalPercent);
      job.updateProgress(globalPercent).catch(console.error);
    });

    let outputPath = filePath;

    if (hasConversion) {

      await videoStateService.setStatus(videoId, "converting", 50);
      await job.updateProgress(50);

      const duration = await getVideoDuration(filePath);

      outputPath = await convertVideo(
        filePath,
        videoId,
        outputFormat,
        duration,
        (percent) => {
          const globalPercent = Math.round(50 + (percent / 2));
          videoStateService.setStatus(videoId, "converting", globalPercent);
          job.updateProgress(globalPercent).catch(console.error);
        },
      );
    }


    await videoStateService.update(videoId, {
      status: "completed",
      progress: 100,
      outputFilePath: outputPath,
    });
  } catch (error) {
    await videoStateService.update(videoId, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Erro desconhecido",
    });
    throw error;
  }
}
