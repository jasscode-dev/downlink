import { OutputFormat } from "@video-converter/shared/types/video.js";
import { spawn } from "node:child_process";
import path from "node:path";

import ffmpegPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";

const CONVERTED_DIR = path.resolve(
  process.cwd(),
  "../../storage/converted",
);

const AUDIO_ONLY_FORMATS = ["mp3", "wav"];

export function convertVideo(
  inputPath: string,
  videoId: string,
  format: OutputFormat,
  durationSeconds: number,
  onProgress: (percent: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      return reject(new Error("ffmpeg-static não encontrou o binário"));
    }

    const outputPath = path.join(CONVERTED_DIR, `${videoId}.${format}`);
    const isAudioOnly = AUDIO_ONLY_FORMATS.includes(format);

    let args: string[] = [];

    if (format === "gif") {

      args = [
        "-i", inputPath,
        "-vf", "fps=10,scale='min(640,iw)':-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
        "-y",
        outputPath,
      ];
    } else {
      args = [
        "-i", inputPath,
        ...(isAudioOnly ? ["-vn"] : []),
        "-y",
        outputPath,
      ];
    }

    const ffmpegProcess = spawn(ffmpegPath as unknown as string, args);

    ffmpegProcess.stderr.on("data", (chunk: Buffer) => {
      const text = chunk.toString();

      const timeMatch = text.match(/time=(\d+):(\d+):(\d+\.\d+)/);

      if (timeMatch && durationSeconds > 0) {
        const [, h, m, s] = timeMatch;

        const elapsed =
          Number(h) * 3600 +
          Number(m) * 60 +
          Number(s);

        const percent = Math.min(
          100,
          Math.round((elapsed / durationSeconds) * 100),
        );

        onProgress(percent);
      }
    });

    ffmpegProcess.on("close", (code) => {
      if (code !== 0) {
        return reject(
          new Error(`ffmpeg finalizou com código ${code}`),
        );
      }

      onProgress(100);
      resolve(outputPath);
    });

    ffmpegProcess.on("error", reject);
  });
}

export function getVideoDuration(
  inputPath: string,
): Promise<number> {
  return new Promise((resolve, reject) => {
    if (!ffprobeStatic.path) {
      return reject(
        new Error("ffprobe-static não encontrou o binário"),
      );
    }

    const ffprobeProcess = spawn(ffprobeStatic.path, [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      inputPath,
    ]);

    let output = "";

    ffprobeProcess.stdout.on("data", (chunk: Buffer) => {
      output += chunk.toString();
    });

    ffprobeProcess.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error("ffprobe falhou"));
      }

      resolve(Number(output.trim()) || 0);
    });

    ffprobeProcess.on("error", reject);
  });
}