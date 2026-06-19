import { spawn } from "node:child_process";
import path from "node:path";
import { readdir } from "node:fs/promises";

export interface DownloadResult {
  filePath: string;
  title: string;
}

const DOWNLOADS_DIR = path.resolve(process.cwd(), "../../storage/downloads");

export function downloadVideo(
  url: string,
  jobId: string,
  onProgress: (percent: number) => void,
): Promise<DownloadResult> {
  return new Promise((resolve, reject) => {
    const outputTemplate = path.join(DOWNLOADS_DIR, `${jobId}.%(ext)s`);


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
      console.error(`[yt-dlp][${jobId}] ${chunk.toString()}`);
    });

    ytDlp.on("close", async (code) => {
      if (code !== 0) {
        return reject(new Error(`yt-dlp finalizou com código ${code}`));
      }

      try {

        const files = await readdir(DOWNLOADS_DIR);
        const downloadedFile = files.find(f => f.startsWith(jobId));

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
