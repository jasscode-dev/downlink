import type { Job } from "bullmq";
import type { CreateJobInput } from "@video-converter/shared/types/job.js";
import { jobStateService } from "../services/jobState.service.js";
import { downloadVideo } from "../services/ytdlp.service.js";
import { convertVideo, getVideoDuration } from "../services/ffmpeg.service.js";

export async function videoConversionProcessor(job: Job<CreateJobInput>) {
  const jobId = job.id!;
  const { url, outputFormat } = job.data;

  try {

    await jobStateService.setStatus(jobId, "downloading", 0);

    const { filePath } = await downloadVideo(url, jobId, (percent) => {
      jobStateService.setStatus(jobId, "downloading", percent);
    });

    let outputPath = filePath;

    if (outputFormat) {

      await jobStateService.setStatus(jobId, "converting", 0);

      const duration = await getVideoDuration(filePath);

      outputPath = await convertVideo(
        filePath,
        jobId,
        outputFormat,
        duration,
        (percent) => {
          jobStateService.setStatus(jobId, "converting", percent);
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
