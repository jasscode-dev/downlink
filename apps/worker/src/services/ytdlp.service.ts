import { spawn } from "node:child_process";
import path from "node:path";
import { readdir } from "node:fs/promises";
import { VideoInfo } from "@video-converter/shared/types/video.js";

export interface DownloadResult {
  filePath: string;
  title: string;
}

const DOWNLOADS_DIR = path.resolve(process.cwd(), "../../storage/downloads");

export function downloadVideo(
  url: string,
  videoId: string,
  onProgress: (percent: number) => void,
): Promise<DownloadResult> {
  return new Promise((resolve, reject) => {
    const outputTemplate = path.join(DOWNLOADS_DIR, `${videoId}.%(ext)s`);


    const ytDlp = spawn("yt-dlp", [
      url,
      "-o", outputTemplate,
      "--newline",
    ]);

    let title = "";

    ytDlp.stdout.on("data", (chunk: Buffer) => {
      const text = chunk.toString();



      const progressMatch = text.match(/(\d+(?:\.\d+)?)%/);
      if (progressMatch) {
        onProgress(Math.round(parseFloat(progressMatch[1])));

      }


    });


    ytDlp.stderr.on("data", (chunk: Buffer) => {
      console.error(`[yt-dlp][${videoId}] ${chunk.toString()}`);
    });

    ytDlp.on("close", async (code) => {
      if (code !== 0) {
        return reject(new Error(`yt-dlp finalizou com código ${code}`));
      }

      try {

        const files = await readdir(DOWNLOADS_DIR);
        const downloadedFile = files.find(f => f.startsWith(videoId));

        if (!downloadedFile) {
          return reject(new Error("Arquivo baixado não foi encontrado"));
        }

        const finalPath = path.join(DOWNLOADS_DIR, downloadedFile);
        resolve({ filePath: finalPath, title });
      } catch (err) {
        reject(err);
      }
    });

    ytDlp.on("error", reject);
  });
}

export async function getVideoInfo(url: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    const ytDlp = spawn("yt-dlp", ["--dump-json", url]);

    let output = "";

    ytDlp.stdout.on("data", (data) => {
      output += data.toString();
    });

    ytDlp.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`yt-dlp exited with code ${code}`));
      }
      try {
        const info = JSON.parse(output);
        resolve({
          title: info.title || "Video",
          thumbnailUrl: info.thumbnail || "",
          duration: info.duration,
        });
      } catch (e) {
        reject(new Error("Failed to parse yt-dlp output"));
      }
    });

    ytDlp.on("error", (err) => {
      reject(err);
    });
  });
}
