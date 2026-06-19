import type { Job } from "bullmq";
import type { CreateJobInput } from "@video-converter/shared/types/job.js";
import { jobStateService } from "../services/jobState.service.js";
import { downloadVideo } from "../services/ytdlp.service.js";
import { convertVideo, getVideoDuration } from "../services/ffmpeg.service.js";

export async function videoConversionProcessor(job: Job<CreateJobInput>) {
  const jobId = job.id!;
  const { url, outputFormat } = job.data;

  try {

    const hasConversion = !!outputFormat && outputFormat !== "mp4";

    await jobStateService.setStatus(jobId, "downloading", 0);

    const { filePath } = await downloadVideo(url, jobId, (percent) => {
      const globalPercent = hasConversion ? Math.round(percent / 2) : percent;
      jobStateService.setStatus(jobId, "downloading", globalPercent);
    });

    let outputPath = filePath;

    if (hasConversion) {

      await jobStateService.setStatus(jobId, "converting", 50);

      const duration = await getVideoDuration(filePath);

      outputPath = await convertVideo(
        filePath,
        jobId,
        outputFormat,
        duration,
        (percent) => {
          jobStateService.setStatus(jobId, "converting", Math.round(50 + (percent / 2)));
        },
      );
    }


    await jobStateService.update(jobId, {
      status: "completed",
      progress: 100,
      outputFilePath: outputPath,
    });
  } catch (error) {
    await jobStateService.update(jobId, {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Erro desconhecido",
    });
    throw error;
  }
}
